import { route, optDate, optEnum, optInt, badRequest } from '@/server/http';
import { logAction } from '@/server/services/audit';
import { ADMIN_TYPES, buildTable, render } from '@/server/services/export';

export const dynamic = 'force-dynamic';

/** Admin exports business-wide data (optionally for one customer) as CSV or PDF. */
export const GET = route('admin', async ({ query, me }) => {
  const admin = me();
  const type = optEnum(query, 'type', ADMIN_TYPES);
  const format = optEnum(query, 'format', ['csv', 'pdf'] as const);
  if (!type || !format) throw badRequest('type and format are required');
  const userId = optInt(query, 'userId');
  const table = await buildTable(
    type,
    { userId: userId ?? null, label: userId ? `Customer #${userId}` : 'All customers' },
    { startDate: optDate(query, 'startDate'), endDate: optDate(query, 'endDate') },
  );
  const out = await render(table, format);
  await logAction('EXPORT_DATA', 'Export', type, admin.email, `Exported ${type} as ${format.toUpperCase()} (${table.rows.length} rows)`);
  return new Response(Buffer.from(out.bytes), {
    headers: {
      'Content-Type': out.contentType,
      'Content-Disposition': `attachment; filename="${out.filename}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Cache-Control': 'private, no-store',
    },
  });
});
