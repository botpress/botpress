import { Router } from 'express'
import Joi from 'joi'

import { validateBodySchema } from './common/assert'
import { success, asyncMiddleware } from './common/reply'

import PairingService from '~/services/pairing'

export default ({ config, db }) => {
  const router = Router()
  const svc = PairingService({ config, db })

  router.post(
    '/',
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          token: Joi.string()
            .min(10)
            .max(30)
            .trim()
            .required(),
          name: Joi.string()
            .min(2)
            .max(40)
            .trim()
            .required(),
          description: Joi.string()
            .max(250)
            .trim()
            .optional()
        })
      )

      const { token, name, description = '' } = req.body
      const result = await svc.pairBot({ token, name, description })

      return success(res)('Bot paired successfully', result)
    })
  )

  router.put(
    '/env',
    asyncMiddleware(async (req, res) => {
      validateBodySchema(
        req,
        Joi.object().keys({
          token: Joi.string()
            .min(10)
            .max(30)
            .trim()
            .required(),
          botUrl: Joi.string()
            .uri({ scheme: [/https?/] })
            .trim()
            .required(),
          env: Joi.string()
            .alphanum()
            .min(2)
            .max(20)
            .trim()
            .required()
        })
      )

      const { token, botUrl, env } = req.body

      const result = await svc.updateEnv({ token, botUrl, env })

      return success(res)('Bot environement updated successfully', result)
    })
  )

  return router
}
