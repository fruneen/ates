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
    tokenPayload = jwt.verify(inputToken, config.JWT_SECRET_KEY) as { userPublicId: string };
  } catch (error) {
    logger.debug(error);
    ctx.throw(401);
  }

  if (!tokenPayload?.userPublicId) {
    ctx.throw(401);
  }

  const user = await userService.findOne({ publicId: tokenPayload.userPublicId });

  if (!user) {
    ctx.throw(401);
  }

  const token = await tokenService.findOne({ value: inputToken, userId: user._id });

  if (!token) {
    ctx.throw(401);
  }

  await userService.updateLastRequest(tokenPayload.userPublicId);

  ctx.body = { userPublicId: user.publicId };
}

export default (router: AppRouter) => {
  router.get('/verify-token', validateMiddleware(schema), handler);
};
