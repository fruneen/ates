import { z } from 'zod';

import { TransactionOperation, TransactionType } from 'enums';

import dbSchema from './db.schema';

import { accountingTaskSchema } from './task.schema';

export const transactionSchema = dbSchema.extend({
  userPublicId: z.string(),
  amount: z.number(),
  type: z.nativeEnum(TransactionType),
  operation: z.nativeEnum(TransactionOperation),
  task: accountingTaskSchema.pick({
    publicId: true,
    costs: true,
  }),
});