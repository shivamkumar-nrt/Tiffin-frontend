import { route, ok } from '@/server/http';

export const dynamic = 'force-dynamic';

const STARTED = new Date().toISOString();

export const GET = route('public', async ({  }) => {
  return Response.json({
    status: 'UP',
    service: 'tiffin-service-backend',
    serverTime: new Date().toISOString(),
    uptimeSince: STARTED,
  });
});
