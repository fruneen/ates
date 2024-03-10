import { TaskUser } from 'types';
import { taskUserSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<TaskUser>(DATABASE_DOCUMENTS.USERS, {
  schemaValidator: (obj) => taskUserSchema.parseAsync(obj),
});

export default service;
