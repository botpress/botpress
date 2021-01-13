import * as sdk from 'botpress/sdk';
import { asyncMiddleware as asyncMw, StandardError } from 'common/http';

import Database from './db';

export default (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger);
  const router = bp.http.createRouterForBot('clients');

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      try {
        const clients = [{
          username: 'Roman',
          lastname: 'Vizitiu'
        }];
        res.send(clients);
      } catch (err) {
        throw new StandardError('Cannot get clients', err);
      }
    })
  );

}
