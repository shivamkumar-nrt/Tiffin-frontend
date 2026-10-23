import { route, ok, intParam, parseBody } from '@/server/http';
import { updateRequestSchema } from '@/server/schemas';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('user', async ({ params, me }) => {
  return ok(await tiffin.getRequestById(intParam(params.id), me()));
});

export const PUT = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const dto = await parseBody(req, updateRequestSchema);
  return ok(await tiffin.updateRequest(intParam(params.id), dto, me().email));
});
