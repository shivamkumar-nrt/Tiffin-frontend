import { route, optDate, optEnum, badRequest } from '@/server/http';
import { logAction } from '@/server/services/audit';
import { MY_TYPES, buildTable, render } from '@/server/services/export';

export const dynamic = 'force-dynamic';

/** Any signed-in user (customer or admin) downloads their own data as CSV or PDF. */
export const GET = route('user', async ({ query, me }) => {
  const user = me();
  const type = optEnum(query, 'type', MY_TYPES);
  const format = optEnum(query, 'format', ['csv', 'pdf'] as const);
  if (!type || !format) throw badRequest('type and format are required');
  const table = await buildTable(
    type,
    { userId: user.id, label: user.fullName },
    { startDate: optDate(query, 'startDate'), endDate: optDate(query, 'endDate') },
  );
  const out = await render(table, format);
  await logAction('EXPORT_DATA', 'Export', type, user.email, `Exported own ${type} as ${format.toUpperCase()} (${table.rows.length} rows)`);
  return new Response(Buffer.from(out.bytes), {
    headers: {
      'Content-Type': out.contentType,
      'Content-Disposition': `attachment; filename="${out.filename}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
      'Cache-Control': 'private, no-store',
    },
  });
});
