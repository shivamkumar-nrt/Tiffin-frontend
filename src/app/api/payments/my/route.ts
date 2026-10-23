import { route, ok } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await payments.getMyPayments(me().id));
});
