import _ from 'lodash'
import axios from 'axios'

import BasicStrategy from './strategy-basic'

const httpConfig = require('../../../config/auth-http.json')

export default ({ config, db }) => {
  const basicAuthenticationFn = async (username, password) => {
    const config = { ...httpConfig }
    delete config.mapping
    delete config.requestMapping

    _.set(config, httpConfig.requestMapping.username, username)
    _.set(config, httpConfig.requestMapping.password, password)

    const { data } = await axios(config)

    return data
  }

  const basicAuthenticationMapping = httpConfig.mapping

  const basicAuthenticationName = 'http'

  return BasicStrategy({ config, db, basicAuthenticationFn, basicAuthenticationMapping, basicAuthenticationName })
}
