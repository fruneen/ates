import { AppKoa } from 'types';

import attachCustomErrors from './middlewares/attach-custom-errors.middleware';
import routeErrorHandler from './middlewares/route-error-handler.middleware';
import extractTokens from './middlewares/extract-tokens.middleware';

import publicRoutes from './public.routes';
import privateRoutes from './private.routes';

const defineRoutes = (app: AppKoa) => {
  app.use(attachCustomErrors);
  app.use(routeErrorHandler);
  app.use(extractTokens);

  publicRoutes(app);
  privateRoutes(app);
};

export default defineRoutes;
