import { route, ok } from '@/server/http';
import { getAdminDashboardStats } from '@/server/services/dashboard';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({  }) => {
  return ok(await getAdminDashboardStats());
});
