import { AccountingTask } from 'types';
import { accountingTaskSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<AccountingTask>(DATABASE_DOCUMENTS.TASKS, {
  schemaValidator: (obj) => accountingTaskSchema.parseAsync(obj),
});

export default service;
