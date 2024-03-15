import _ from 'lodash';

import { Task } from 'types';
import { taskSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<Task>(DATABASE_DOCUMENTS.TASKS, {
  schemaValidator: (obj) => taskSchema.parseAsync(obj),
});

const privateFields = ['_id'];

const getPublic = (task: Task | null) => _.omit(task, privateFields);

export default Object.assign(service, {
  getPublic,
});
