import { route, ok } from '@/server/http';
import { getRecentLogs } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({  }) => {
  return ok(await getRecentLogs());
});
