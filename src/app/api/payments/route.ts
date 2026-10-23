import { route, ok, optEnum, optInt, pageParams, parseBody } from '@/server/http';
import { createPaymentSchema } from '@/server/schemas';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  return ok(
    await payments.searchPayments(
      {
        userId: optInt(query, 'userId'),
        status: optEnum(query, 'status', ['PENDING_VERIFICATION', 'SUCCESS', 'FAILED'] as const),
      },
      pageParams(query, 10),
    ),
  );
});

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, createPaymentSchema);
  return ok(await payments.recordPayment(dto, me().email), 'Payment recorded and processed successfully');
});
