import Joi from 'joi'

import RootAuthentication from './root'
import CloudAuthentication from './cloud'
import NoneAuthentication from './none'
import { isDeveloping } from '../util'

module.exports = async options => {
  if (isDeveloping) {
    const schema = Joi.object().keys({
      dataLocation: Joi.string()
        .min(1)
        .required(),
      projectLocation: Joi.string()
        .min(1)
        .required(),
      securityConfig: Joi.object().required(),
      db: Joi.object().required(),
      cloud: Joi.object().required(),
      logger: Joi.object().required()
    })

    Joi.assert(options, schema, 'Invalid constructor elements for Authentication Provider')
  }

  const isCloudPaired = options.securityConfig.useCloud && (await options.cloud.isPaired())

  if (!options.securityConfig.enabled) {
    return new NoneAuthentication(options)
  }

  if (isCloudPaired) {
    return new CloudAuthentication(options)
  } else {
    return new RootAuthentication(options)
  }
}
