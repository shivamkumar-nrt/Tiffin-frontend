/**
 * Copies the data of the OLD Spring Boot backend (Hibernate tables in a Postgres database,
 * normally the "public" schema of the Neon database) into the SQLite database this app now uses.
 *
 *   LEGACY_PG_URL=postgresql://... npm run db:import-legacy -- --dry-run   # counts only
 *   LEGACY_PG_URL=postgresql://... npm run db:import-legacy                # copy
 *
 * The Postgres side is only ever read (SELECT). The target is whatever the app points at
 * (DATABASE_URL=file:... or TURSO_DATABASE_URL=...).
 * Env: LEGACY_SCHEMA (default "public"), MIGRATION_TZ (zone the old JVM ran in; default UTC,
 * which is what Render uses).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { Client, types } from 'pg';
import { importAll, Dump, TABLES } from './lib/importer';

// Keep DATE / TIMESTAMP columns as the raw strings Postgres sends: node-postgres would otherwise
// reinterpret them in the local machine's timezone and shift dates.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1114, (v) => v);
// Hibernate ids are BIGINT; node-postgres returns them as strings.
types.setTypeParser(20, (v) => Number(v));

function targetPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return new PrismaClient({ adapter: new PrismaLibSQL(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })) });
  }
  return new PrismaClient();
}

/** node-postgres returns Date / numeric strings / bigint; turn them into what the importer expects. */
function normalize(v: unknown): unknown {
  if (v instanceof Date) {
    const p = (n: number, w = 2) => String(n).padStart(w, '0');
    return (
      `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())} ` +
      `${p(v.getUTCHours())}:${p(v.getUTCMinutes())}:${p(v.getUTCSeconds())}.${p(v.getUTCMilliseconds(), 3)}`
    );
  }
  if (typeof v === 'bigint') return Number(v);
  return v;
}

async function main() {
  const pgUrl = process.env.LEGACY_PG_URL;
  if (!pgUrl) throw new Error('Set LEGACY_PG_URL to the Postgres connection string holding the old data.');
  const legacy = process.env.LEGACY_SCHEMA || 'public';

  const pg = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const d: Dump = {};
  try {
    const present = new Set(
      (
        await pg.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', [legacy])
      ).rows.map((r) => r.table_name as string),
    );
    if (!present.has('users')) throw new Error(`No legacy "users" table found in schema "${legacy}".`);
    for (const t of [...TABLES, 'combo_items']) {
      if (!present.has(t)) continue;
      const res = await pg.query(`SELECT * FROM "${legacy}"."${t}"`);
      d[t] = res.rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, normalize(v)])));
    }
  } finally {
    await pg.end();
  }

  const prisma = targetPrisma();
  try {
    await importAll(prisma, d, {
      wipe: process.argv.includes('--wipe'),
      dryRun: process.argv.includes('--dry-run'),
      tz: process.env.MIGRATION_TZ || 'UTC',
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
