import { route, ok, parseBody, pageParams } from '@/server/http';
import { registerSchema } from '@/server/schemas';
import * as users from '@/server/services/users';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  return ok(
    await users.searchUsers(
      query.get('search'),
      pageParams(query, 10),
      query.get('sortBy') ?? 'createdAt',
      query.get('direction') ?? 'desc',
    ),
  );
});

export const POST = route('admin', async ({ req, user }) => {
  const dto = await parseBody(req, registerSchema);
  return ok(await users.register(dto, user), 'User created successfully');
});
