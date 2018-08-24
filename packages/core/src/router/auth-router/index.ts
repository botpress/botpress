import Joi from 'joi'

import { Logger } from '../../misc/interfaces'
import AuthService from '../../services/auth/auth-service'
import { InvalidOperationError } from '../../services/auth/errors'

import { BaseRouter } from '../base-router'

import { asyncMiddleware, error as sendError, success as sendSuccess, validateBodySchema } from './util'

export class AuthRouter extends BaseRouter {
  asyncMiddleware: Function
  constructor(private logger: Logger, private authService: AuthService) {
    super()
    this.asyncMiddleware = asyncMiddleware({ logger })
  }

  basicLogin = async (req, res) => {
    validateBodySchema(
      req,
      Joi.object().keys({
        username: Joi.string()
          .min(1)
          .trim()
          .required(),
        password: Joi.string()
          .min(1)
          .required()
      })
    )

    if (!this.authService.supportsBasicLogin()) {
      throw new InvalidOperationError('Basic authentication is not supported')
    }

    const ip = process.env.USING_REVERSE_PROXY
      ? req.headers['x-forwarded-for'] || req.connection.remoteAddress
      : req.connection.remoteAddress

    const jwtToken = await this.authService.basicLogin(req.body.username, req.body.password, ip)

    return sendSuccess(res, 'Login successful', {
      token: jwtToken
    })
  }

  setupRoutes() {
    const router = this.router

    router.post('/login', this.asyncMiddleware(this.basicLogin))
  }
}
