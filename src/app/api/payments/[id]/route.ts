import { route, ok, intParam } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('user', async ({ params, me }) => {
  return ok(await payments.getPaymentById(intParam(params.id), me()));
});
