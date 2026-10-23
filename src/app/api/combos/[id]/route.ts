import { route, ok, intParam, parseBody } from '@/server/http';
import { comboSchema } from '@/server/schemas';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route<{ id: string }>('public', async ({ params }) => {
  return ok(await catalog.getComboById(intParam(params.id)));
});

export const PUT = route<{ id: string }>('admin', async ({ req, params, me }) => {
  const dto = await parseBody(req, comboSchema);
  return ok(
    await catalog.updateCombo(intParam(params.id), dto, me().email),
    'Combo / Thali package updated successfully',
  );
});

export const DELETE = route<{ id: string }>('admin', async ({ params, me }) => {
  await catalog.deleteCombo(intParam(params.id), me().email);
  return ok(null, 'Combo package deleted successfully');
});
