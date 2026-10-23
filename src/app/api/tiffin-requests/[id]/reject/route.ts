import { route, ok, intParam, parseOptionalBody } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const body = await parseOptionalBody(req);
  const reason = typeof body?.rejectionReason === 'string' ? body.rejectionReason : null;
  return ok(await tiffin.rejectRequest(intParam(params.id), reason, me().email), 'Request rejected');
});
