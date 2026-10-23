/**
 * Copies the data the OLD Spring Boot backend left in Postgres (Hibernate tables in the legacy
 * schema, normally "public") into the new Prisma schema of the SAME database.
 *
 *   npm run db:import-legacy -- --dry-run     # shows what would be copied, writes nothing
 *   npm run db:import-legacy                  # copies
 *
 * The legacy tables are only ever read (SELECT). They are never modified or dropped, so the old
 * backend keeps working and you can roll back at any time.
 *
 * Requirements: DATABASE_URL must point at a DIFFERENT schema than the legacy one,
 * e.g. ...neon.tech/neondb?sslmode=require&schema=tiffin_app   (legacy data stays in "public").
 * Env: LEGACY_SCHEMA (default "public"), MIGRATION_TZ (zone the old JVM ran in; default UTC,
 * which is what Render uses).
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { importAll, Dump, TABLES, targetSchema } from './lib/importer';

const prisma = new PrismaClient();

/** Prisma returns Date/BigInt/Decimal for raw queries; turn them into what the importer expects. */
function normalize(v: unknown): unknown {
  if (v instanceof Date) {
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    return (
      `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())} ` +
      `${p(v.getUTCHours())}:${p(v.getUTCMinutes())}:${p(v.getUTCSeconds())}.${p(v.getUTCMilliseconds(), 3)}`
    );
  }
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Prisma.Decimal) return v.toString();
  return v;
}

async function main() {
  const legacy = process.env.LEGACY_SCHEMA || 'public';
  const target = targetSchema();
  if (legacy === target) {
    throw new Error(
      `DATABASE_URL points at schema "${target}", the same as the legacy data. Add &schema=tiffin_app to DATABASE_URL and DIRECT_URL, run "npm run db:migrate", then retry.`,
    );
  }

  const present = new Set(
    (
      await prisma.$queryRaw<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables WHERE table_schema = ${legacy}`
    ).map((r) => r.table_name),
  );
  if (!present.has('users')) {
    throw new Error(`No legacy "users" table found in schema "${legacy}". Nothing to import.`);
  }

  const d: Dump = {};
  for (const t of [...TABLES, 'combo_items']) {
    if (!present.has(t)) continue;
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM "${legacy}"."${t}"`);
    d[t] = rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, normalize(v)])));
  }

  await importAll(prisma, d, {
    wipe: process.argv.includes('--wipe'),
    dryRun: process.argv.includes('--dry-run'),
    tz: process.env.MIGRATION_TZ || 'UTC',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
