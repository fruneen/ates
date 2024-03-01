import { AppKoa } from 'types';

import publicRoutes from './public.routes';
import privateRoutes from './private.routes';

const defineRoutes = (app: AppKoa) => {
  publicRoutes(app);
  privateRoutes(app);
};

export default defineRoutes;
