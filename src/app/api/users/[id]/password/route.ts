import { route, ok, badRequest, intParam, parseOptionalBody } from '@/server/http';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const PATCH = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const body = await parseOptionalBody(req);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (password.length < 6) throw badRequest('Password must be at least 6 characters');
  await users.resetUserPassword(intParam(params.id), password, me().email);
  return ok(null, 'Password updated successfully');
});
