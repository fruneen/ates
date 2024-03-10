import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { AppKoaContext, AppRouter } from 'types';

import { userService } from 'resources/user';
import { tokenService } from 'resources/token';

import { validateMiddleware } from 'middlewares';

import config from 'config';

const schema = z.object({
  token: z.string().min(1, 'Token is required'),
});

type ValidatedData = z.infer<typeof schema>;

async function handler(ctx: AppKoaContext<ValidatedData>) {
  const { token: inputToken } = ctx.validatedData;

  let tokenPayload;

  try {
    tokenPayload = jwt.verify(inputToken, config.JWT_SECRET_KEY) as { userId: string };
  } catch (error) {
    logger.debug(error);
    ctx.throw(401);
  }

  if (!tokenPayload?.userId) {
    ctx.throw(401);
  }


  const [user, token] = await Promise.all([
    userService.findOne({ _id: tokenPayload.userId }),
    tokenService.findOne({ value: inputToken, userId: tokenPayload.userId }),
  ]);

  if (!user || !token) {
    ctx.throw(401);

  }
  await userService.updateLastRequest(tokenPayload.userId);

  ctx.body = { userId: user._id };
}

export default (router: AppRouter) => {
  router.get('/verify-token', validateMiddleware(schema), handler);
};
