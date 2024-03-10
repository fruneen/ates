import { AppKoaContext, Next, AppRouter, TaskStatus } from 'types';

import { taskService } from 'resources/task';


type Request = {
  params: {
    taskId: string;
  };
};

async function validator(ctx: AppKoaContext<never, Request>, next: Next) {
  const isTaskExists = await taskService.exists({ _id: ctx.request.params.taskId });

  ctx.assertError(isTaskExists, 'Task not found');

  await next();
}

async function handler(ctx: AppKoaContext<never, Request>) {
  ctx.body = await taskService.updateOne(
    { _id: ctx.request.params.taskId },
    () => ({ status: TaskStatus.COMPLETED }),
  );
}


export default (router: AppRouter) => {
  router.post('/:taskId/complete', validator, handler);
};
