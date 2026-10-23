import { route, ok } from '@/server/http';
import { getMyNotifications } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await getMyNotifications(me().email), 'Notifications fetched');
});
