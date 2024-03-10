import { AppKoa } from 'types';

import attachCustomErrors from './middlewares/attach-custom-errors.middleware';
import routeErrorHandler from './middlewares/route-error-handler.middleware';
import extractTokens from './middlewares/extract-tokens.middleware';
import tryToAttachUser from './middlewares/try-to-attach-user.middleware';

import publicRoutes from './public.routes';
import privateRoutes from './private.routes';

const defineRoutes = (app: AppKoa) => {
  app.use(attachCustomErrors);
  app.use(routeErrorHandler);
  app.use(extractTokens);
  app.use(tryToAttachUser);

  publicRoutes(app);
  privateRoutes(app);
};

export default defineRoutes;
