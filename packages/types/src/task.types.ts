import { z } from 'zod';

import { accountingTaskSchema, taskSchema } from 'schemas';

export type Task = z.infer<typeof taskSchema>;

export type AccountingTask = z.infer<typeof accountingTaskSchema>;
