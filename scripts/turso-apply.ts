/**
 * Runs a SQL file (e.g. prisma/sqlite-init.sql) against the Turso database in
 * TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Creates tables only if they do not exist yet.
 *
 *   npx tsx scripts/turso-apply.ts prisma/sqlite-init.sql
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@libsql/client';

async function main() {
  const file = process.argv[2];
  const url = process.env.TURSO_DATABASE_URL;
  if (!file || !url) throw new Error('usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... turso-apply <file.sql>');
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const existing = new Set(
    (await db.execute("SELECT name FROM sqlite_master WHERE type IN ('table','index')")).rows.map((r) => String(r.name)),
  );

  // Strip comment lines, split on statement terminators (the generated SQL has no ';' inside values).
  const statements = readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const todo = statements.filter((s) => {
    const m = /^CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+"([^"]+)"/i.exec(s);
    return !(m && existing.has(m[1]));
  });
  console.log(`${statements.length} statements, ${statements.length - todo.length} already present, applying ${todo.length}`);
  if (todo.length) await db.batch(todo, 'write');

  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  console.log('tables:', tables.rows.map((r) => r.name).join(', '));
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
