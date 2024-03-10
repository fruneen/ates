import moment from 'moment';

import { transactionService } from 'resources/transaction';

import { AppKoaContext, Next, AppRouter, UserRole, TransactionType } from 'types';

async function validator(ctx: AppKoaContext, next: Next) {
  const { user } = ctx.state;

  ctx.assertError(
    [UserRole.MANAGER, UserRole.ADMIN].includes(user.role),
    'Forbidden',
  );

  await next();
}

async function handler(ctx: AppKoaContext) {
  ctx.body = await transactionService.aggregate([
    {
      $match: {
        createdOn: {
          $gte: moment().startOf('day').toDate(),
        },
        type: {
          $ne: TransactionType.PAYMENT,
        },
      },
    },
    {
      $group: {
        _id: '$operation',
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: null,
        creditTotal: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'CREDIT'] }, '$totalAmount', 0],
          },
        },
        debitTotal: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'DEBIT'] }, '$totalAmount', 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalCredit: '$creditTotal',
        totalDebit: '$debitTotal',
        difference: { $subtract: ['$debitTotal', '$creditTotal'] },
      },
    },
  ]);
}

export default (router: AppRouter) => {
  router.get('/revenue', validator, handler);
};
