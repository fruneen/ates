import { routeUtil } from 'utils';

import getBalance from './actions/get-balance';
import getTransactions from './actions/get-transactions';
import getRevenue from './actions/get-transactions';

const privateRoutes = routeUtil.getRoutes([
  getBalance,
  getTransactions,
  getRevenue,
]);

export default {
  privateRoutes,
};
