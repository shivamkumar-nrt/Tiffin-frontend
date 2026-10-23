import { route, ok, optDate, optInt, pageParams } from '@/server/http';
import * as invoices from '@/server/services/invoices';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  return ok(
    await invoices.searchInvoices(
      {
        userId: optInt(query, 'userId'),
        startDate: optDate(query, 'startDate'),
        endDate: optDate(query, 'endDate'),
      },
      pageParams(query, 10),
    ),
  );
});
