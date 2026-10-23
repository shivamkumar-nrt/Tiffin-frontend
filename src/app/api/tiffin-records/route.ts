import { route, ok, optDate, optEnum, optInt, pageParams } from '@/server/http';
import * as tiffin from '@/server/services/tiffin';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({ query }) => {
  return ok(
    await tiffin.searchRecords(
      {
        userId: optInt(query, 'userId'),
        status: optEnum(query, 'status', ['UNPAID', 'BILLED_PAID'] as const),
        startDate: optDate(query, 'startDate'),
        endDate: optDate(query, 'endDate'),
      },
      pageParams(query, 10),
    ),
  );
});
