import { route, ok, parseBody } from '@/server/http';
import { submitPaymentSchema } from '@/server/schemas';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const POST = route('user', async ({ req, me }) => {
  const dto = await parseBody(req, submitPaymentSchema);
  return ok(
    await payments.submitCustomerPayment(dto, me().email),
    'Payment submitted successfully. Awaiting admin verification.',
  );
});
