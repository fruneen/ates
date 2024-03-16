import { z } from 'zod';

import { TaskStatus } from 'enums';

import dbSchema from './db.schema';

import { taskUserSchema } from './user.schema';

export const taskSchemaV1 = dbSchema.extend({
  publicId: z.string().uuid(),

  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.IN_PROGRESS),
  assignee: taskUserSchema.pick({ publicId: true, role: true }),
}).strict();

export const taskSchema = dbSchema.extend({
  publicId: z.string().uuid(),

  title: z.string(),
  jiraId: z.string(),
  description: z.string(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.IN_PROGRESS),
  assignee: taskUserSchema.pick({ publicId: true, role: true }),
}).strict();

export const accountingTaskSchema = dbSchema.merge(taskSchema
  .pick({ publicId: true, description: true, jiraId: true })
  .extend({
    assignee: taskUserSchema.pick({ publicId: true, role: true }),
    costs: z.number().positive().default(Math.floor(Math.random() * (40 - 20 + 1)) + 20),
  }),
);

export const analyticsTaskSchema = dbSchema
  .merge(taskSchema.pick({ publicId: true, status: true, assignee: true }))
  .merge(accountingTaskSchema.pick({ costs: true }));