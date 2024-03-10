import _ from 'lodash';

import { taskService } from 'resources/task';
import { userService } from 'resources/user';

import { AppKoaContext, Next, AppRouter, UserRole, TaskStatus } from 'types';

async function validator(ctx: AppKoaContext, next: Next) {
  const { user } = ctx.state;

  ctx.assertError(
    [UserRole.MANAGER, UserRole.ADMIN].includes(user.role),
    'Forbidden',
  );

  await next();
}

async function handler(ctx: AppKoaContext) {
  const [{ results: users }, { results: tasks }] = await Promise.all([
    userService.find({
      role: {
        $nin: [UserRole.MANAGER, UserRole.ADMIN],
      },
    }),
    taskService.find({
      status: TaskStatus.IN_PROGRESS,
      'assignee.role': {
        $nin: [UserRole.MANAGER, UserRole.ADMIN],
      },
    }),
  ]);

  const shuffledTasks = [...tasks];
  for (let i = shuffledTasks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTasks[i], shuffledTasks[j]] = [shuffledTasks[j], shuffledTasks[i]];
  }

  // Assign shuffled tasks to users
  const tasksPerUser = Math.floor(shuffledTasks.length / users.length);
  let taskIndex = 0;
  for (const user of users) {
    const userTasks = shuffledTasks.slice(taskIndex, taskIndex + tasksPerUser);
    taskIndex += tasksPerUser;

    // Update tasks with new assignee in the database
    await Promise.all(userTasks.map(async task => {
      await taskService.updateOne(
        { _id: task._id },
        () => ({ assignee: _.pick(user, ['publicId', 'role']) }),
      );
    }));
  }

  // Distribute remaining tasks
  const remainingTasks = shuffledTasks.slice(taskIndex);
  for (let i = 0; i < remainingTasks.length; i++) {
    const user = users[i % users.length];
    // Update a task with new assignee in the database
    await taskService.updateOne(
      { _id: remainingTasks[i]._id },
      () => ({ assignee: _.pick(user, ['publicId', 'role']) }),
    );
  }

  ctx.status = 200;
}

export default (router: AppRouter) => {
  router.post('/assign', validator, handler);
};
