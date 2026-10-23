import { route, ok, intParam } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ params, me }) => {
  return ok(
    await payments.markPaymentSuccess(intParam(params.id), me().email),
    'Payment verified and invoices generated',
  );
});
