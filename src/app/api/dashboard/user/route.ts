import { route, ok } from '@/server/http';
import { getUserDashboardStats } from '@/server/services/dashboard';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await getUserDashboardStats(me().email));
});
