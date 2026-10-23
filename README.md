# Tiffin Service Management System (Next.js full-stack)

The former Spring Boot backend now lives inside this Next.js app as Route Handlers
(`src/app/api/**/route.ts`). The URLs, request bodies and JSON responses are the same as before,
so the UI code did not change; it simply calls `/api/...` on the same origin.

- **Framework:** Next.js 14 (App Router), React 18, Tailwind
- **Database:** PostgreSQL (Neon) via Prisma (`prisma/schema.prisma`)
- **Auth:** JWT (HS256, `jose`) + bcrypt (`bcryptjs`); hashes from the old backend keep working
- **PDF invoices:** `pdf-lib` · **Email:** `nodemailer` · **WhatsApp:** HTTP gateway (Meta / UltraMsg / generic)

```
src/app/api/…        HTTP layer (one folder per old controller)
src/server/          business logic (services), Prisma client, auth/error helpers, mail, PDF
prisma/              schema, migrations, seed
scripts/             one-time data migration from the old backend
```

## Run locally

```bash
cp .env.example .env          # fill DATABASE_URL, DIRECT_URL (Neon) and JWT_SECRET
npm install                   # also runs `prisma generate`
npm run db:migrate            # creates the tables
npm run db:seed               # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD (only if no users)
npm run dev                   # http://localhost:3000
```

Neon: copy both connection strings from **Connect** (pooled -> `DATABASE_URL`, direct -> `DIRECT_URL`).
`JWT_SECRET` can be any long random string (`openssl rand -base64 48`). Email, WhatsApp and the cron
secret are optional; without SMTP/WhatsApp credentials messages are only logged.

## Keeping the old data

### A) Old data is already in Neon (written by the Spring backend) - recommended

The new app uses its **own schema** (`tiffin_app`) inside the same Neon database. The old tables in
`public` are only read (SELECT), never changed or dropped, so you can roll back at any time.

1. In `.env` add `&schema=tiffin_app` to **both** URLs, e.g.
   `postgresql://USER:PASS@ep-xxx-pooler.../neondb?sslmode=require&schema=tiffin_app`
2. `npm run db:migrate` (creates the new tables in `tiffin_app`)
3. `npm run db:import-legacy -- --dry-run` (prints row counts, writes nothing)
4. `npm run db:import-legacy` (copies users, prices, combos, menus, requests, records, payments,
   invoices, audit log, notifications)

Ids, password hashes and invoice numbers are preserved and sequences are reset. The import refuses to
run twice into a non-empty schema. Old timestamps are read as `MIGRATION_TZ` (default `UTC`, which is
what Render runs in; use `Asia/Kolkata` if the old backend ran on an IST machine). Do **not** run
`db:seed` before importing. For cut-over, stop the old backend first; anything it writes after the
import stays only in the old tables.

### B) Old data only in the local H2 file

```bash
java -cp h2-2.2.224.jar scripts/DumpH2.java ../backend/data/tiffindb h2-dump.json
npm run db:migrate
npm run db:import-h2 -- h2-dump.json
```

## Deploying

- Set the env vars from `.env.example` on the host (at minimum `DATABASE_URL`, `DIRECT_URL`,
  `JWT_SECRET`) and run `npm run db:migrate` against the production database.
- `vercel.json` schedules the monthly payment reminder (25th-31st, 09:00 IST) by calling
  `/api/cron/payment-reminders`. Set `CRON_SECRET`; Vercel sends it as a Bearer token. On other hosts
  call that URL daily with `Authorization: Bearer $CRON_SECRET`.
- The Render keep-alive ping and the Redis cache from the old backend are not needed anymore.
