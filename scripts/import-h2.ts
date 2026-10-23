/**
 * Imports the JSON produced by scripts/DumpH2.java into the database in DATABASE_URL.
 *
 *   npm run db:import-h2 -- h2-dump.json [--wipe] [--dry-run]
 *
 * Legacy H2 timestamps had no zone; they are read as MIGRATION_TZ (default Asia/Kolkata).
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { importAll, Dump } from './lib/importer';

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('usage: npm run db:import-h2 -- <h2-dump.json> [--wipe] [--dry-run]');
  const d: Dump = JSON.parse(readFileSync(file, 'utf8'));
  await importAll(prisma, d, {
    wipe: process.argv.includes('--wipe'),
    dryRun: process.argv.includes('--dry-run'),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
