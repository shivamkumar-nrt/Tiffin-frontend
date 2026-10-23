import { route, ok, parseBody } from '@/server/http';
import { authRequestSchema } from '@/server/schemas';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const POST = route('public', async ({ req }) => {
  const dto = await parseBody(req, authRequestSchema);
  return ok(await users.login(dto.email, dto.password), 'Login successful');
});
