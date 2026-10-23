import { route, ok, parseBody } from '@/server/http';
import { registerSchema } from '@/server/schemas';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const POST = route('public', async ({ req, user }) => {
  const dto = await parseBody(req, registerSchema);
  return ok(await users.register(dto, user), 'User registered successfully');
});
