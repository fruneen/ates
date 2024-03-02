import { z } from 'zod';

import { UserRole } from 'enums';

import dbSchema from './db.schema';

export const userSchema = dbSchema.extend({
  firstName: z.string(),
  lastName: z.string(),

  email: z.string(),
  passwordHash: z.string().nullable().optional(),

  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),

  lastRequest: z.coerce.date().optional(),
});

export const taskUserSchema = dbSchema.merge(userSchema.pick({ role: true }));
