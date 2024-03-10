import { taskService } from 'resources/task';

import { AppKoaContext, AppRouter } from 'types';

async function handler(ctx: AppKoaContext) {
  const { user } = ctx.state;

  ctx.body = await taskService.find({
    'assignee.publicId': user.publicId,
  });
}

export default (router: AppRouter) => {
  router.get('/', handler);
};
