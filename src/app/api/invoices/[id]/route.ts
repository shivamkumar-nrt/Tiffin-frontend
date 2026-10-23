import { route, ok, intParam } from '@/server/http';
import * as invoices from '@/server/services/invoices';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('user', async ({ params, me }) => {
  return ok(await invoices.getInvoiceById(intParam(params.id), me()));
});
