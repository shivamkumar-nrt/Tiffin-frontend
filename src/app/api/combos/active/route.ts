import { route, ok } from '@/server/http';
import * as catalog from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

export const GET = route('public', async ({  }) => {
  return ok(await catalog.getActiveCombos());
});
