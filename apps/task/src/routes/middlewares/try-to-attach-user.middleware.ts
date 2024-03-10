import axios from 'axios';

import config from 'config';

import { userService } from 'resources/user';
import { AppKoaContext, Next } from 'types';

const tryToAttachUser = async (ctx: AppKoaContext, next: Next) => {
  const token = ctx.state.accessToken;

  if (token) {
    try {
      const response = await axios.get<{ userPublicId: string }>(`${config.AUTH_URL}/account/verify-token?token=${token}`);

      const publicId = response.data?.userPublicId;

      if (publicId) {
        let user = await userService.findOne({ publicId });

        if (!user) {
          user = await userService.insertOne({ publicId });
        }

        if (user) {
          ctx.state.user = user;
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }

  return next();
};

export default tryToAttachUser;
