import { z } from 'zod';

import { transactionSchema } from 'schemas';

export type Transaction = z.infer<typeof transactionSchema>;
