import * as sdk from 'botpress/sdk'
import jsonwebtoken from 'jsonwebtoken'

import { jwtAuthorizerMiddleware } from './auth'

export default async (bp: typeof sdk) => {
  const authRouter = bp.http.createRouterForBot('uipath/auth', {
    checkAuthentication: true
  })

  const rootRouter = bp.http.createRouterForBot('uipath', {
    checkAuthentication: false
  })

  authRouter.get('/token', async (req, res) => {
    const expiresIn = req.query.expiresIn || '1m'

    try {
      const token = jsonwebtoken.sign({}, process.APP_SECRET, { expiresIn })
      res.send({ token })
    } catch (err) {
      res.status(400).send(err)
    }
  })

  rootRouter.use(jwtAuthorizerMiddleware)
  rootRouter.post('/message', async (req, res) => {
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
      res.status(400).send(err)
    }
  })
}
