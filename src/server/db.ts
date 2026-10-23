import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Production: Turso (hosted SQLite) via the libSQL driver adapter (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
 * Local dev / scripts: a plain SQLite file from DATABASE_URL (e.g. file:./dev.db).
 * TURSO_DATABASE_URL may also be a file: URL, which runs the exact same adapter path locally.
 */
function createPrisma(): PrismaClient {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
