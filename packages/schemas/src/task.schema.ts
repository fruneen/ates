import { z } from 'zod';

import { TaskStatus } from 'enums';

import dbSchema from './db.schema';

import { taskUserSchema } from './user.schema';

export const taskSchema = dbSchema.extend({
  description: z.string(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.IN_PROGRESS),
  assignee: taskUserSchema.pick({ _id: true, role: true }),
}).strict();
