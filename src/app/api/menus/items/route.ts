import { route, ok, parseBody } from '@/server/http';
import { menuItemSchema } from '@/server/schemas';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({  }) => {
  return ok(await catalog.getAllMenuItems());
});

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, menuItemSchema);
  return ok(await catalog.createMenuItem(dto, me().email), 'Menu dish item added successfully');
});
