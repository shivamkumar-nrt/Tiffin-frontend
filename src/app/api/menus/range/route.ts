import { route, ok, badRequest, optDate } from '@/server/http';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({ query }) => {
  const start = optDate(query, 'startDate');
  const end = optDate(query, 'endDate');
  if (!start || !end) throw badRequest('startDate and endDate are required');
  return ok(await catalog.getMenusInRange(start, end));
});
