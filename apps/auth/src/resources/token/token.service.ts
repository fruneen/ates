import jwt from 'jsonwebtoken';


import { Token, TokenType } from 'types';
import { tokenSchema } from 'schemas';
import { DATABASE_DOCUMENTS, JWT_EXPIRATION_SECONDS } from 'app-constants';

import config from 'config';

import db from 'db';

const service = db.createService<Token>(DATABASE_DOCUMENTS.TOKENS, {
  schemaValidator: (obj) => tokenSchema.parseAsync(obj),
});

service.createIndex({ 'createdOn': 1 }, { expireAfterSeconds: JWT_EXPIRATION_SECONDS });

const createToken = async (userId: string, type: TokenType = TokenType.ACCESS ) => {
  const value = jwt.sign({ userId }, config.JWT_SECRET_KEY, { expiresIn: JWT_EXPIRATION_SECONDS });

  return service.insertOne({
    type,
    value,
    userId,
  });
};

const removeTokens = async (token: string) => {
  return service.deleteMany({ value: { $in: [token] } });
};

export default Object.assign(service, {
  createToken,
  removeTokens,
});
