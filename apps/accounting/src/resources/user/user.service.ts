import { AccountingUser } from 'types';
import { accountingUserSchema } from 'schemas';
import { DATABASE_DOCUMENTS } from 'app-constants';

import db from 'db';

const service = db.createService<AccountingUser>(DATABASE_DOCUMENTS.USERS, {
  schemaValidator: (obj) => accountingUserSchema.parseAsync(obj),
});

export default service;
