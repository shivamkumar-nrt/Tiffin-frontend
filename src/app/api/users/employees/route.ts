import { route, ok } from '@/server/http';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({  }) => {
  return ok(await users.getAllEmployees());
});
