import axios from 'axios';

import config from 'config';

import { AppKoaContext, Next, UserRole } from 'types';

const tryToAttachUser = async (ctx: AppKoaContext, next: Next) => {
  const token = ctx.state.accessToken;

  if (token) {
    try {
      const response = await axios.get<{ userPublicId: string, role: UserRole }>(`${config.AUTH_URL}/account/verify-token?token=${token}`);

      const { userPublicId: publicId, role } = response.data;

      if (publicId && role !== UserRole.EMPLOYEE) {
        ctx.state.user = { _id: publicId, publicId, role };
      }
    } catch (e) {
      logger.error(e);
    }
  }

  return next();
};

export default tryToAttachUser;
