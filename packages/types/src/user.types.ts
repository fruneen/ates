import { z } from 'zod';

import { accountingUserSchema, taskUserSchema, userSchema } from 'schemas';

export type User = z.infer<typeof userSchema>;

export type TaskUser = z.infer<typeof taskUserSchema>;

export type AccountingUser = z.infer<typeof accountingUserSchema>;
