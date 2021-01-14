import { asyncMiddleware as asyncMw, StandardError } from 'common/http';
import * as sdk from 'botpress/sdk';

import Database from './db';

export default (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger);
  const router = bp.http.createRouterForBot('users');

  router.get(
    '/',
    asyncMiddleware(async (req, res) => {
      try {
        const users = [{
          username: 'Roman',
          lastname: 'Vizitiu'
        }];
        res.send(users);
      } catch (err) {
        throw new StandardError('Cannot get users', err);
      }
    })
  );


  router.post(
    '/auth',
    asyncMiddleware(async (req, res) => {
      try {
        const createdUser = await db.upsert(req.body);
        return res.send(createdUser).status(201);
      } catch (err) {
        throw new StandardError('Cannot get users', err);
      }
    })
  );

}
