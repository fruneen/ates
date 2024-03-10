import { z } from 'zod';

import { taskUserSchema, userSchema } from 'schemas';

export type User = z.infer<typeof userSchema>;

export type TaskUser = z.infer<typeof taskUserSchema>;
