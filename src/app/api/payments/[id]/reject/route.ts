import { route, ok, intParam, parseOptionalBody } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const body = await parseOptionalBody(req);
  const reason = typeof body?.reason === 'string' ? body.reason : 'Payment details could not be verified';
  return ok(await payments.rejectPayment(intParam(params.id), reason, me().email), 'Payment has been marked as rejected');
});
