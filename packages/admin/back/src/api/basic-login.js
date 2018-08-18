import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { InvalidOperationError } from '~/errors'

import { validateRequestSchema } from './common/assert'
import { success, asyncMiddleware } from './common/reply'

import AuthenticationService from '~/services/authentication'

export default ({ config, db }) => {
  const authSvc = AuthenticationService({ config, db })

  const router = Router()

  /* ------------
   WARNING
   This router is anonymous, i.e. it is not secured.
   Cautiously add new routes here.
   ------------ */

  router.post(
    '/',
    asyncMiddleware(async (req, res) => {
      validateRequestSchema(
        'body',
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

      if (!authSvc.supportsBasicLogin) {
        throw new InvalidOperationError('Basic authentication is not supported')
      }

      let ip = process.env.USING_REVERSE_PROXY
        ? req.headers['x-forwarded-for'] || req.connection.remoteAddress
        : req.connection.remoteAddress

      const jwtToken = await authSvc.basicLogin(req.body.username, req.body.password, ip)

      return success(res)('Login successful', {
        token: jwtToken
      })
    })
  )

  return router
}
