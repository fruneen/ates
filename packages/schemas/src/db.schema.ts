import { z } from 'zod';

export default z.object({
  _id: z.string(),

  createdOn: z.coerce.date().optional(),
  updatedOn: z.coerce.date().optional(),
  deletedOn: z.coerce.date().optional().nullable(),
}).strict();
