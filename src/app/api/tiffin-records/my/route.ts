import { route, ok } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await tiffin.getMyRecords(me().id));
});
