import { z } from 'zod';

import { billingCycleSchema } from 'schemas';

export type BillingCycle = z.infer<typeof billingCycleSchema>;
