import { route, ok, badRequest, optDate } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  const date = optDate(query, 'date');
  if (!date) throw badRequest('date is required');
  return ok(await tiffin.getRecordsByDate(date));
});
