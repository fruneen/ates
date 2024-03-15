import { z } from 'zod';

import { accountingTaskSchema, analyticsTaskSchema, taskSchema } from 'schemas';

export type Task = z.infer<typeof taskSchema>;

export type AccountingTask = z.infer<typeof accountingTaskSchema>;

export type AnalyticsTask = z.infer<typeof analyticsTaskSchema>;
