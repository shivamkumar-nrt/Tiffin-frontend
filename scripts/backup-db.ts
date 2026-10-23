/**
 * Read-only backup of every table of a Postgres database (all schemas except system ones)
 * into one JSON file. Use it before any risky migration.
 *
 *   PG_URL=postgresql://... npm run db:backup -- ../backups/neon-backup.json
 *
 * The file contains personal data and password hashes: keep it private, never commit it.
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Client, types } from 'pg';

types.setTypeParser(1082, (v) => v);
types.setTypeParser(1114, (v) => v);

async function main() {
  const url = process.env.PG_URL || process.env.LEGACY_PG_URL;
  if (!url) throw new Error('Set PG_URL to the Postgres connection string.');
  const out = resolve(process.argv[2] || `backup-${new Date().toISOString().slice(0, 10)}.json`);
  const pg = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  const data: Record<string, Record<string, unknown[]>> = {};
  const counts: string[] = [];
  try {
    const tables = (
      await pg.query(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')
           AND table_name <> '_prisma_migrations'
         ORDER BY table_schema, table_name`,
      )
    ).rows;
    for (const { table_schema, table_name } of tables) {
      const res = await pg.query(`SELECT * FROM "${table_schema}"."${table_name}"`);
      (data[table_schema] ??= {})[table_name] = res.rows;
      counts.push(`${table_schema}.${table_name}: ${res.rows.length}`);
    }
  } finally {
    await pg.end();
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify({ createdAt: new Date().toISOString(), data }, null, 2), 'utf8');
  console.log(counts.join('\n'));
  console.log(`\nBackup written: ${out} (${(statSync(out).size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
