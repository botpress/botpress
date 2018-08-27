import { version } from '../../../package.json'
import { Router } from 'express'
import apicache from 'apicache'

import { checkCloudAuth } from './common/auth'
import Util from './common/util'

import AuthenticationService from '~/services/authentication'

import pairing from './pairing'
import tokenLogin from './token-login'
import wellKnown from './wellKnown'
import bots from './bots'

export default ({ config, db }) => {
  const api = Router()

  const authSvc = AuthenticationService({ config, db })
  const { loadUser } = Util({ config, db, authSvc })

  const cache = apicache.middleware

  api.use('/pairing', pairing({ config, db }))

  api.use('/bots', checkCloudAuth({ config, db }), bots({ config, db }))

  api.use('/login', checkCloudAuth({ config, db }), loadUser, tokenLogin({ config, db }))

  api.use('/.well-known', cache('30 minutes'), wellKnown({ config, db }))

  api.get('/', (req, res) => {
    res.json({ version })
  })

  return api
}
