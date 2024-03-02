import mount from 'koa-mount';
import compose from 'koa-compose';

import { AppKoa } from 'types';

import { taskRoutes } from 'resources/task';

import auth from './middlewares/auth.middleware';

export default (app: AppKoa) => {
  app.use(mount('/tasks', compose([auth, taskRoutes.privateRoutes])));
};
