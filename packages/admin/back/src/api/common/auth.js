import fs from 'fs'
import path from 'path'

import jwksRsa from 'jwks-rsa'
import jwt from 'express-jwt'

import AuthenticationService from '~/services/authentication'
import { UnauthorizedAccessError } from '~/errors'

const _checkCloudAuth_Auth0 = jwt({
  // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.AUTH0_JWKS_URI || `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_JWKS_AUDIENCE || process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_JWKS_ISSUER || `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
})

const _checkCloudAuth_CliToken = async (authSvc, req, res, next) => {
  let [, token] = req.headers.authorization.split(' ')

  token = token.substr('cli__'.length)

  if (!token.length) {
    return next(new UnauthorizedAccessError('Invalid authentication token'))
  }

  try {
    const userId = await authSvc.getUserIdFromCliToken(token)

    if (!userId) {
      return next(new UnauthorizedAccessError('Invalid authentication token'))
    }

    req.user = { iss: 'cli_token', id: userId }
  } catch (err) {
    return next(err)
  }

  next()
}

const _checkCloudAuth_BotToken = async (db, req, res, next) => {
  let [, token] = req.headers.authorization.split(' ')

  token = token.substr('bot__'.length)

  if (!token.length) {
    return next(new UnauthorizedAccessError('Invalid authentication token'))
  }

  try {
    const bot = await db.models.bot.findOne({
      where: {
        pairingToken: token,
        paired: true
      },
      attributes: ['publicId']
    })

    if (!bot) {
      throw new UnauthorizedAccessError('Invalid bot token')
    }

    req.user = { iss: 'bot_token', id: bot.publicId }
  } catch (err) {
    return next(err)
  }

  next()
}

const checkCloudAuth = ({ config, db }) => {
  const authSvc = AuthenticationService({ config, db })
  return (req, res, next) => {
    const auth = req.headers && req.headers.authorization
    if (auth && /bearer cli__/i.test(auth)) {
      return _checkCloudAuth_CliToken(authSvc, req, res, next)
    } else if (auth && /bearer bot__/i.test(auth)) {
      return _checkCloudAuth_BotToken(db, req, res, next)
    } else {
      return _checkCloudAuth_Auth0(req, res, next)
    }
  }
}

const checkBotAuth = jwt({
  secret: fs.readFileSync(path.resolve('./keys/jwt.key.pub')),
  issuer: process.env.JWT_ISSUER,
  algorithms: ['RS256']
})

export { checkCloudAuth, checkBotAuth }
