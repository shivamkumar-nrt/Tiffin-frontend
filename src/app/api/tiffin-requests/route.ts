import { route, ok, optDate, optEnum, optInt, pageParams, parseBody } from '@/server/http';
import { createRequestSchema } from '@/server/schemas';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  return ok(
    await tiffin.getRequests(
      {
        userId: optInt(query, 'userId'),
        status: optEnum(query, 'status', ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const),
        startDate: optDate(query, 'startDate'),
        endDate: optDate(query, 'endDate'),
      },
      pageParams(query, 10),
    ),
  );
});

export const POST = route('user', async ({ req, me }) => {
  const dto = await parseBody(req, createRequestSchema);
  return ok(await tiffin.createRequest(dto, me()), 'Tiffin request submitted successfully');
});
