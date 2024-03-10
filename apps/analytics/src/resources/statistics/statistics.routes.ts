import { routeUtil } from 'utils';

import getRevenue from './actions/get-revenue';
import getTasksOverview from './actions/get-tasks-overview';

const privateRoutes = routeUtil.getRoutes([
  getRevenue,
  getTasksOverview,
]);

export default {
  privateRoutes,
};
