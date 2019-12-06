import * as sdk from 'botpress/sdk'
import jsonwebtoken from 'jsonwebtoken'

export class ResponseError extends Error {
  errorCode: string
  statusCode: number

  skipLogging = false

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

class UnauthorizedError extends ResponseError {
  type = 'UnauthorizedError'

  constructor(message: string) {
    super(`Unauthorized: ${message}`, 401, 'BP_0041')
  }
}

const onServerStarted = async (bp: typeof sdk) => {
  const authRouter = bp.http.createRouterForBot('uipath/auth', {
    checkAuthentication: true
  })

  const rootRouter = bp.http.createRouterForBot('uipath', {
    checkAuthentication: false
  })

  authRouter.get('/token', async (req, res) => {
    const expiresIn = req.query.expiresIn || '1m'

    try {
      const token = jsonwebtoken.sign({ text: 'something' }, process.APP_SECRET, { expiresIn })
      res.status(200).send({ token })
    } catch (err) {
      res.status(400).send(err)
    }
  })

  rootRouter.post(
    '/message',
    async (req, res, next) => {
      if (!req.headers.authorization) {
        return next(new UnauthorizedError('Authorization header is missing'))
      }

      const [scheme, token] = req.headers.authorization.split(' ')
      if (scheme.toLowerCase() !== 'bearer') {
        return next(new UnauthorizedError(`Unknown scheme "${scheme}"`))
      }

      if (!token) {
        return next(new UnauthorizedError('Authentication token is missing'))
      }

      try {
        jsonwebtoken.verify(token, process.APP_SECRET)
      } catch (err) {
        return next(new UnauthorizedError('Invalid authentication token'))
      }

      next()
    },
    async (req, res) => {
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
    }
  )
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  definition: {
    name: 'uipath',
    menuIcon: 'none',
    menuText: 'UiPath',
    noInterface: true,
    fullName: 'UiPath',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint
