import { route, ok, intParam } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route<{ userId: string }>('admin', async ({ params }) => {
  return ok(await tiffin.getUnpaidRecordsForUser(intParam(params.userId, 'userId')));
});
