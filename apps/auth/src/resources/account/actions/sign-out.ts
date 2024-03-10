import { AppKoaContext, AppRouter } from 'types';

import { tokenService } from 'resources/token';

const handler = async (ctx: AppKoaContext) => {
  await tokenService.removeTokens(ctx.state.accessToken);

  ctx.status = 204;
};

export default (router: AppRouter) => {
  router.post('/sign-out', handler);
};
