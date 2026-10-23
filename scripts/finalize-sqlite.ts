/**
 * Prepares a SQLite file for upload to Turso ("Upload SQLite File"): WAL journal mode,
 * fully checkpointed into the single .db file, integrity-checked.
 *
 *   npx tsx scripts/finalize-sqlite.ts ../backups/tiffin-build.db ../backups/tiffin-for-turso.db
 */
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@libsql/client';

async function main() {
  const src = process.argv[2] ? resolve(process.argv[2]) : '';
  const dst = process.argv[3] ? resolve(process.argv[3]) : '';
  if (!src || !dst) throw new Error('usage: finalize-sqlite <source.db> <output.db>');
  copyFileSync(src, dst);

  const db = createClient({ url: `file:${dst.split('\\').join('/')}` });
  const mode = await db.execute('PRAGMA journal_mode=WAL');
  await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
  const integrity = await db.execute('PRAGMA integrity_check');
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  console.log('journal_mode:', Object.values(mode.rows[0] ?? {})[0]);
  console.log('integrity_check:', Object.values(integrity.rows[0] ?? {})[0]);
  for (const t of tables.rows) {
    const n = await db.execute(`SELECT COUNT(*) AS c FROM "${t.name}"`);
    console.log(`  ${String(t.name).padEnd(26)} ${n.rows[0].c}`);
  }
  db.close();

  console.log(`\nWritten ${dst} (${(statSync(dst).size / 1024).toFixed(1)} KB)`);
  for (const ext of ['-wal', '-shm']) if (existsSync(dst + ext)) console.log(`note: leftover ${dst}${ext}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
