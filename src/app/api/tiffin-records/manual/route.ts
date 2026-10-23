import { route, ok, parseBody } from '@/server/http';
import { manualRecordSchema } from '@/server/schemas';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, manualRecordSchema);
  return ok(await tiffin.addManualRecord(dto, me().email));
});
