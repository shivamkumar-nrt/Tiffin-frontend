import { route, ok, parseBody } from '@/server/http';
import { broadcastSchema } from '@/server/schemas';
import { sendBroadcast } from '@/server/services/notifications';

export const dynamic = 'force-dynamic';

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, broadcastSchema);
  const result = await sendBroadcast(dto, me().email);
  return ok(result, `Broadcast sent successfully to ${result.recipientsCount} customers.`);
});
