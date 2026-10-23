import { route, ok, intParam, parseBody } from '@/server/http';
import { userStatusSchema } from '@/server/schemas';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const dto = await parseBody(req, userStatusSchema);
  return ok(await users.updateUserStatus(intParam(params.id), dto.status, me().email), 'User status updated');
});
