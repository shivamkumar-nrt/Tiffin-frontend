import { route, ok, pageOf, pageParams } from '@/server/http';
import { getLogs } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  const paging = pageParams(query, 20);
  const { rows, total } = await getLogs(paging);
  return ok(pageOf(rows, total, paging.page, paging.size));
});
