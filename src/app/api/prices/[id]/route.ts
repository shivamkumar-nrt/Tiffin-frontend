import { route, ok, intParam, parseBody } from '@/server/http';
import { priceSchema } from '@/server/schemas';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const PUT = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const dto = await parseBody(req, priceSchema);
  return ok(await catalog.updatePrice(intParam(params.id), dto, me().email), 'Price configuration updated');
});
