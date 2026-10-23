import { route, ok } from '@/server/http';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({ me }) => {
  return ok(await users.getUserByEmail(me().email));
});
