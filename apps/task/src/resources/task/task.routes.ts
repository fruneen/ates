import { routeUtil } from 'utils';

import assign from './actions/assign';
import complete from './actions/complete';
import create from './actions/create';
import list from './actions/list';

const privateRoutes = routeUtil.getRoutes([
  assign,
  complete,
  create,
  list,
]);

export default {
  privateRoutes,
};
