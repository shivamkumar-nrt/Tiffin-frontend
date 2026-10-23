import { route, ok } from '@/server/http';
import * as payments from '@/server/services/payments';

export const dynamic = 'force-dynamic';

export const GET = route('user', async ({  }) => {
  return ok(payments.getReminderStatus());
});
