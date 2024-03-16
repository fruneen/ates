import _ from 'lodash';

import { AccountingTask } from 'types';
import { accountingTaskSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<AccountingTask>(DATABASE_DOCUMENTS.TASKS, {
  schemaValidator: (obj) => accountingTaskSchema.parseAsync(obj),
});

const privateFields = ['_id'];

const getPublic = (task: AccountingTask | null) => _.omit(task, privateFields);

export default Object.assign(service, {
  getPublic,
});

