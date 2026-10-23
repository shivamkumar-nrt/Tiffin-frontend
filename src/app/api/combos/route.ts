import { route, ok, parseBody } from '@/server/http';
import { comboSchema } from '@/server/schemas';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({  }) => {
  return ok(await catalog.getAllCombos());
});

export const POST = route('admin', async ({ req, me }) => {
  const dto = await parseBody(req, comboSchema);
  return ok(await catalog.createCombo(dto, me().email), 'Combo / Thali package created successfully');
});
