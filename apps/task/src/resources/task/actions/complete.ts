import { AppKoaContext, Next, AppRouter, TaskStatus, Event, EventName, TopicName } from 'types';

import { taskService } from 'resources/task';

import kafka from 'kafka';

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
  const task = await taskService.updateOne(
    { _id: ctx.request.params.taskId },
    () => ({ status: TaskStatus.COMPLETED }),
  );

  if (!task) {
    ctx.throwError('Task wasn\'t created');
  }

  const event: Event = {
    name: EventName.TaskCompleted,
    data: task,
  };

  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: TopicName.TasksLifecycle,
    messages: [{ value: JSON.stringify(event) }],
  });

  ctx.body = task;
}


export default (router: AppRouter) => {
  router.post('/:taskId/complete', validator, handler);
};
