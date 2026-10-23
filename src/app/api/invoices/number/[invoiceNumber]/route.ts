import { route, ok } from '@/server/http';
import * as invoices from '@/server/services/invoices';

export const dynamic = 'force-dynamic';

export const GET = route<{ invoiceNumber: string }>('user', async ({ params, me }) => {
  return ok(await invoices.getInvoiceByNumber(params.invoiceNumber, me()));
});
