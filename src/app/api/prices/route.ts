import { route, ok, parseBody } from '@/server/http';
import { priceSchema } from '@/server/schemas';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('admin', async ({  }) => {
  return ok(await catalog.getAllPrices());
});

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, priceSchema);
  return ok(await catalog.createPrice(dto, me().email), 'Price configuration created');
});
