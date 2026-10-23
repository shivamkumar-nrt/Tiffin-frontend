import { route, ok, intParam } from '@/server/http';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const DELETE = route<{ id: string }>('admin', async ({ params, me }) => {
  await catalog.deleteMenu(intParam(params.id), me().email);
  return ok(null, 'Menu deleted successfully');
});
