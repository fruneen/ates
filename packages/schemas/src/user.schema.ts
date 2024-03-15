import { z } from 'zod';

import { UserRole } from 'enums';

import dbSchema from './db.schema';

export const userSchema = dbSchema.extend({

  _id: z.string(),

  publicId: z.string().uuid(),

  firstName: z.string(),
  lastName: z.string(),

  email: z.string(),

  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE),

  lastRequest: z.coerce.date().optional(),
  createdOn: z.coerce.date().optional(),
});

export const taskUserSchema = dbSchema.merge(userSchema.pick({
  publicId: true,
  role: true,
}));

export const accountingUserSchema = dbSchema.merge(userSchema
  .pick({
    publicId: true,
    role: true,
  })
  .extend({
    balance: z.number().positive().default(0),
  }),
);
