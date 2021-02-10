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

    router.post(
      '/logout',
      asyncMiddleware(async (req, res) => {
        try {
          const deleted = await db.delete(req.body.login);
          res.send(!!deleted);
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
          const [user] = await db.getUserByUserID(req.body.target);
          if (!user) {
            return res.status(404).send({
              error: 'Not found user by target'
            });
          }
          const event = {
            channel: user.channel, target: user.userId, botId: 'ecbv2' // TODO - get bot id from req
          };
          const payloads = await bp.cms.renderElement(
            'builtin_text', { text: req.body.message.body.en }, event
          );
          await bp.events.replyToEvent(event, payloads);
          return res.status(200).send([]);
        } catch (err) {
          throw new StandardError('Cannot get user', err);
        }
      })
    );
  }

}
