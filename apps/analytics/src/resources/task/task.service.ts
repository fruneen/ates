import { AnalyticsTask } from 'types';
import { analyticsTaskSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<AnalyticsTask>(DATABASE_DOCUMENTS.TASKS, {
  schemaValidator: (obj) => analyticsTaskSchema.parseAsync(obj),
});

export default service;
