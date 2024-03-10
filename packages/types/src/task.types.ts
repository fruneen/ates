import { z } from 'zod';

import { taskSchema } from 'schemas';

export type Task = z.infer<typeof taskSchema>;
