import mount from 'koa-mount';
import compose from 'koa-compose';

import { AppKoa } from 'types';

import { statisticsRoutes } from 'resources/statistics';

import auth from './middlewares/auth.middleware';

export default (app: AppKoa) => {
  app.use(mount('/statistics', compose([auth, statisticsRoutes.privateRoutes])));
};
