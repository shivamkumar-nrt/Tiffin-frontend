const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/** Calendar parts of "now" in the app timezone (replaces Java's LocalDate.now()). */
export function nowParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

/** Today as a UTC-midnight Date, suitable for Postgres DATE columns. */
export function today(): Date {
  const { year, month, day } = nowParts();
  return new Date(Date.UTC(year, month - 1, day));
}

/** 'YYYY-MM-DD' -> Date at UTC midnight. */
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date -> 'YYYY-MM-DD' (Java LocalDate JSON format). */
export function fmtDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Date -> ISO instant (Java LocalDateTime JSON replacement, now timezone-safe). */
export function fmtDateTime(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 'dd MMM yyyy' used in invoices. */
export function fmtLong(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
