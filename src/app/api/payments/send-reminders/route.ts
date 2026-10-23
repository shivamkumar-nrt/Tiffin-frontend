import { route, ok } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const POST = route('admin', async ({ me }) => {
  return ok(await payments.sendBulkPaymentReminders(me().email));
});
