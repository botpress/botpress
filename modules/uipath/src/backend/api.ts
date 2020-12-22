import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, UnexpectedError } from 'common/http'
import jsonwebtoken from 'jsonwebtoken'

import { jwtAuthorizerMiddleware } from './auth'

export default async (bp: typeof sdk) => {
  const asyncMiddleware = asyncMw(bp.logger)
  const authRouter = bp.http.createRouterForBot('uipath/auth', {
    checkAuthentication: true
  })

  const rootRouter = bp.http.createRouterForBot('uipath', {
    checkAuthentication: false
  })

  authRouter.get(
    '/token',
    asyncMiddleware(async (req, res) => {
      const expiresIn = req.query.expiresIn || '1m'

      try {
        const token = jsonwebtoken.sign({}, process.APP_SECRET, { expiresIn })
        res.send({ token })
      } catch (err) {
        throw new UnexpectedError('Could not get token', err)
      }
    })
  )

  rootRouter.use(jwtAuthorizerMiddleware)
  rootRouter.post(
    '/message',
    asyncMiddleware(async (req, res) => {
      try {
        const { channel, target, botId, threadId, message } = req.body

        await bp.events.replyToEvent(
          {
            channel,
            target,
            botId,
            threadId
          },
          [message]
        )

        res.sendStatus(200)
      } catch (err) {
        throw new UnexpectedError('Could not send message', err)
      }
    })
  )
}
