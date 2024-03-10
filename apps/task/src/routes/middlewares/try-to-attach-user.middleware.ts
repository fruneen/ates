import axios from 'axios';

import config from 'config';

import { userService } from 'resources/user';
import { AppKoaContext, Next } from 'types';

const tryToAttachUser = async (ctx: AppKoaContext, next: Next) => {
  const token = ctx.state.accessToken;

  if (token) {
    try {
      const response = await axios.get<{ userId: string }>(`${config.AUTH_URL}/account/verify-token?token=${token}`);

      const userId = response.data?.userId;

      if (userId) {
        let user = await userService.findOne({ _id: userId });

        if (!user) {
          user = await userService.insertOne({ _id: userId });
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
