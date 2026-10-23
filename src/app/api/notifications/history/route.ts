import { route, ok } from '@/server/http';
import { getBroadcastHistory } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({  }) => {
  return ok(await getBroadcastHistory(), 'Broadcast history fetched');
});
