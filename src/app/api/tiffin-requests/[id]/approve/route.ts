import { route, ok, intParam } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ params, me }) => {
  return ok(
    await tiffin.approveRequest(intParam(params.id), me().email),
    'Request approved & consumption record generated',
  );
});
