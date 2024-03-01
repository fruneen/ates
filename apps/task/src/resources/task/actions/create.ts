import _ from 'lodash';
import { z } from 'zod';

import { AppKoaContext, Next, AppRouter, UserRole, TaskUser } from 'types';

import { userService } from 'resources/user';
import { taskService } from 'resources/task';

import { validateMiddleware } from 'middlewares';

const schema = z.object({
  description: z.string().min(1, 'Please enter description'),
  assigneeId: z.string().min(1, 'Please enter assigneeId'),
});

interface ValidatedData extends z.infer<typeof schema> {
  assignee: TaskUser
}

async function validator(ctx: AppKoaContext<ValidatedData>, next: Next) {
  const { assigneeId } = ctx.validatedData;

  const assignee = await userService.findOne({ _id: assigneeId });

  ctx.assertError(assignee, 'Assignee not found');

  ctx.assertError(
    ![UserRole.MANAGER, UserRole.ADMIN].includes(assignee.role),
    'You cannot assign task to this user',
  );

  ctx.validatedData.assignee = assignee;

  await next();
}


async function handler(ctx: AppKoaContext<ValidatedData>) {
  const { description, assignee } = ctx.validatedData;

  ctx.body = await taskService.insertOne({
    description,
    assignee: _.pick(assignee, ['_id', 'role']),
  });
}

export default (router: AppRouter) => {
  router.post('/', validateMiddleware(schema), validator, handler);
};
