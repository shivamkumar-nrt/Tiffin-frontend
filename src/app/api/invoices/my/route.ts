import { route, ok } from '@/server/http';
import * as invoices from '@/server/services/invoices';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await invoices.getMyInvoices(me().id));
});
