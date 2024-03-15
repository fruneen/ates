import { z } from 'zod';

import { TaskStatus } from 'enums';

import dbSchema from './db.schema';

import { taskUserSchema, accountingUserSchema } from './user.schema';

export const taskSchema = dbSchema.extend({
  publicId: z.string().uuid(),

  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.IN_PROGRESS),
  assignee: taskUserSchema.pick({ publicId: true, role: true }),
}).strict();

export const accountingTaskSchema = dbSchema.merge(taskSchema
  .pick({ publicId: true, description: true })
  .extend({
    assignee: accountingUserSchema.pick({ publicId: true, role: true }),
    costs: z.number().positive().default(Math.floor(Math.random() * (40 - 20 + 1)) + 20),
  }),
);