import { Transaction } from 'types';
import { transactionSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<Transaction>(DATABASE_DOCUMENTS.TRANSACTIONS, {
  schemaValidator: (obj) => transactionSchema.parseAsync(obj),
});

export default service;
