import { AccountingTask } from 'types';
import { accountingTaskSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<AccountingTask>(DATABASE_DOCUMENTS.TASKS, {
  schemaValidator: (obj) => accountingTaskSchema.omit({ assignee: true, description: true }).parseAsync(obj),
});

export default service;
