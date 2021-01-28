import { asyncMiddleware as asyncMw, StandardError } from 'common/http';
import * as sdk from 'botpress/sdk';

import Database from './db';

export default (bp: typeof sdk, db: Database) => {
  const asyncMiddleware = asyncMw(bp.logger);

  {
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

    router.get(
      '/:login',
      asyncMiddleware(async (req, res) => {
        try {
          const user = await db.getUserByLogin(req.params.login);
          if (!user.length) {
            throw new StandardError('Not found user by login');
          }
          res.send(user[0]);
        } catch (err) {
          throw new StandardError('Cannot auth user', err);
        }
      })
    );

    router.post(
      '/auth',
      asyncMiddleware(async (req, res) => {
        try {
          const createdUser = await db.upsert(req.body);
          res.send(createdUser[0]);
        } catch (err) {
          throw new StandardError('Cannot auth user', err);
        }
      })
    );
  }

  {
    const router = bp.http.createRouterForBot('notifications', {
      checkAuthentication: false
    });

    router.post(
      '/',
      asyncMiddleware(async (req, res) => {
        try {
          const event = {
            channel: 'web', target: req.body.target, botId: 'ecbv2'
          }
          const payloads = await bp.cms.renderElement(
            'builtin_text', { text: req.body.message.body.en }, event
          );
          await bp.events.replyToEvent(event, payloads);
          return res.status(200).send([]);
        } catch (err) {
          throw new StandardError('Cannot get users', err);
        }
      })
    );
  }

}
