import { route, ok, ApiError, intParam } from '@/server/http';
import { userBalance } from '@/server/services/balance';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('user', async ({ params, me }) => {
  const id = intParam(params.id);
  const caller = me();
  if (caller.role !== 'ROLE_ADMIN' && caller.id !== id) {
    throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
  }
  return ok(await userBalance(id));
});
