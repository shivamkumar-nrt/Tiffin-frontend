import { route, ok, intParam } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('user', async ({ params, me }) => {
  return ok(await tiffin.cancelRequest(intParam(params.id), me().email), 'Request cancelled successfully');
});
