import { z } from 'zod';

import dbSchema from './db.schema';

export const billingCycleSchema = dbSchema.extend({
  userPublicId: z.string(),
  status: z.enum(['opened', 'completed']).default('opened'),
  amount: z.number().positive().optional(),
  date: z.coerce.date(),
  transactionIds: z.array(z.string()).default([]),
});