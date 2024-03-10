import jwt, { TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken';

import config from 'config';

import { userService } from 'resources/user';
import { tokenService } from 'resources/token';

import { AppKoaContext, Next } from 'types';

const tryToAttachUser = async (ctx: AppKoaContext, next: Next) => {
  const accessToken = ctx.state.accessToken;

  if (accessToken) {
    let tokenPayload;

    try {
      tokenPayload = jwt.verify(accessToken, config.JWT_SECRET_KEY) as { userPublicId: string };
    } catch (error) {
      logger.debug(error);
    }

    console.log(tokenPayload);

    if (tokenPayload && tokenPayload.userPublicId) {
      const user = await userService.findOne({ publicId: tokenPayload.userPublicId });
      console.log(user);
      console.log({ value: accessToken, userId: user?._id });
      const token = await tokenService.findOne({ value: accessToken, userId: user?._id });
      console.log(token);

      // const [user, token] = await Promise.all([
      //   userService.findOne({ _id: tokenPayload.userId }),
      //   tokenService.findOne({ value: accessToken, userId: tokenPayload.userId }),
      // ]);

      if (user && token) {
        await userService.updateLastRequest(token.userId);

        ctx.state.user = user;
      }
    }
  }

  return next();
};

export default tryToAttachUser;
