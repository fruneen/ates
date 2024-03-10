import { z } from 'zod';

import { taskService } from 'resources/task';

import { AppKoaContext, AppRouter } from 'types';

const schema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

type ValidatedData = z.infer<typeof schema>;

async function handler(ctx: AppKoaContext<ValidatedData>) {
  const { startDate, endDate } = ctx.validatedData;

  ctx.body = taskService.aggregate([
    {
      $match: {
        createdOn: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $sort: { costs: -1 },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        _id: 0,
        date: { $dateToString: { format: '%d-%m-%Y', date: '$createdOn' } }, // Format date as dd-mm-yyyy
        costs: 1,
      },
    },
  ]);
}

export default (router: AppRouter) => {
  router.get('/tasks', handler);
};
