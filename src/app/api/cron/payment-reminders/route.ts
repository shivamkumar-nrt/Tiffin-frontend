import { route, ok, ApiError } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({ req }) => {
  // Vercel Cron (or any scheduler) calls this with "Authorization: Bearer $CRON_SECRET".
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    throw new ApiError(401, 'Unauthorized');
  }
  // Mirrors the old "0 0 9 25-31 * ?" schedule: only act inside the reminder window.
  if (!payments.getReminderStatus().active) return ok({ skipped: true }, 'Outside reminder window');
  return ok(await payments.sendBulkPaymentReminders('CRON_SCHEDULER'));
});
