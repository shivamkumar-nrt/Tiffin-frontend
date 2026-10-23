import { route, ok, intParam, parseBody } from '@/server/http';
import { updateRecordSchema } from '@/server/schemas';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const PUT = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const dto = await parseBody(req, updateRecordSchema);
  return ok(await tiffin.updateRecord(intParam(params.id), dto, me().email));
});
