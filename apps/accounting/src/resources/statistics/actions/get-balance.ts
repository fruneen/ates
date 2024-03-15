import { AccountingUser, AppKoaContext, AppRouter } from 'types';

async function handler(ctx: AppKoaContext) {
  const user = ctx.state.user as AccountingUser;

  ctx.body = { balance: user.balance };
}

export default (router: AppRouter) => {
  router.get('/balance', handler);
};
