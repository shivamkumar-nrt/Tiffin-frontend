import { route, ok, intParam } from '@/server/http';
import { generateInvoicePdf } from '@/server/services/invoices';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('public', async ({ params }) => {
  const { bytes, invoiceNumber } = await generateInvoicePdf(intParam(params.id));
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=Invoice-${invoiceNumber}.pdf`,
      'Cache-Control': 'private, no-store',
    },
  });
});
