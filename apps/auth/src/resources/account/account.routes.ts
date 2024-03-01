import { routeUtil } from 'utils';

import get from './actions/get';
import update from './actions/update';
import signUp from './actions/sign-up';
import signIn from './actions/sign-in';
import signOut from './actions/sign-out';

const publicRoutes = routeUtil.getRoutes([
  signUp,
  signIn,
  signOut,
]);

const privateRoutes = routeUtil.getRoutes([
  get,
  update,
]);

export default {
  publicRoutes,
  privateRoutes,
};
