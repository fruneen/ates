import { AppKoaContext, AppRouter, AccountingUser } from 'types';

import moment from 'moment';

import { transactionService } from 'resources/transaction';

async function handler(ctx: AppKoaContext) {
  const user = ctx.state.user as AccountingUser;

  ctx.body = await transactionService.find({
    $and: [
      {
        userPublicId: user.publicId,
      },
      {
        createdOn: {
          $gte: moment().startOf('day').toDate(),
        },
      },
    ],
  });
}


export default (router: AppRouter) => {
  router.get('/transactions', handler);
};
