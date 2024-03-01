import { z } from 'zod';

import dbSchema from './db.schema';

export const userSchema = dbSchema.extend({
  firstName: z.string(),
  lastName: z.string(),

  email: z.string(),
  passwordHash: z.string().nullable().optional(),

  lastRequest: z.date().optional(),
}).strict();
