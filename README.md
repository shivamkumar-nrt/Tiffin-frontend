# Tiffin Service Management System (Next.js full-stack)

The former Spring Boot backend lives inside this Next.js app as Route Handlers
(`src/app/api/**/route.ts`). URLs, request bodies and JSON responses are unchanged, so the UI simply
calls `/api/...` on the same origin.

- **Framework:** Next.js 14 (App Router), React 18, Tailwind, three.js (animated gold backdrop)
- **Database:** SQLite, hosted on **Turso** in production (libSQL driver adapter), via Prisma
- **Auth:** JWT (HS256, `jose`) + bcrypt (`bcryptjs`); hashes from the old backend keep working
- **PDF:** `pdf-lib` · **Email:** `nodemailer` · **WhatsApp:** HTTP gateway · **Export:** CSV + PDF for every user

```
src/app/api/…        HTTP layer (one folder per old controller)
src/server/          business logic, Prisma client (db.ts), auth/error helpers, mail, PDF, export
prisma/              schema.prisma, sqlite-init.sql (full schema as SQL), seed
scripts/             data migration / backup tools
```

## Run locally

```bash
cp .env.example .env     # set JWT_SECRET; keep DATABASE_URL="file:./dev.db" and leave TURSO_* empty
npm install              # also runs `prisma generate`
npm run db:push          # creates prisma/dev.db with all tables
npm run db:seed          # first admin from ADMIN_EMAIL / ADMIN_PASSWORD (only when empty)
npm run dev              # http://localhost:3000
```

## Production (Vercel + Turso)

Set on Vercel: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `CRON_SECRET`, `APP_TIMEZONE`,
`PAYEE_NAME`, `PAYEE_UPI_ID` (+ optional `SMTP_*`, `WHATSAPP_*`). No build-time database is needed.

### Creating the Turso database from an existing SQLite file
Turso dashboard -> Create Database -> **Upload SQLite File**. Prepare the file with:

```bash
npx tsx scripts/finalize-sqlite.ts <source.db> <output.db>   # WAL mode + checkpoint + integrity check
```

### Schema changes later
`npm run db:turso-schema > schema.sql` prints the full schema; for incremental changes use
`npx prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel prisma/schema.prisma --script`
and run the SQL in the Turso shell.

## Moving data from the old Postgres (Neon) backend

```bash
# 1. backup first (read-only)
PG_URL=postgresql://... npm run db:backup -- ../backups/neon-backup.json

# 2. build a SQLite file from the legacy Hibernate tables (read-only on Postgres)
DATABASE_URL="file:../../backups/tiffin-build.db" npx prisma db push
LEGACY_PG_URL=postgresql://... DATABASE_URL="file:../../backups/tiffin-build.db" npm run db:import-legacy -- --dry-run
LEGACY_PG_URL=postgresql://... DATABASE_URL="file:../../backups/tiffin-build.db" npm run db:import-legacy
```

Ids, password hashes and invoice numbers are preserved. Old timestamps are read as `MIGRATION_TZ`
(default `UTC`, what Render uses). Re-run with `--wipe` for a final copy right before cut-over.
H2 file instead: `scripts/DumpH2.java` + `npm run db:import-h2 -- h2-dump.json`.

## Scheduled reminders
`vercel.json` calls `/api/cron/payment-reminders` on days 25-31 at 09:00 IST (set `CRON_SECRET`).
