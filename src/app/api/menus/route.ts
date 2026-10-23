import { route, ok, parseBody, optDate } from '@/server/http';
import { menuSchema } from '@/server/schemas';
import { today } from '@/server/time';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({ query }) => {
  return ok(await catalog.getMenuByDate(optDate(query, 'date') ?? today()));
});

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, menuSchema);
  return ok(await catalog.createOrUpdateMenu(dto, me().email), 'Menu saved successfully');
});
