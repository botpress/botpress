import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import nanoid from 'nanoid'

import { InvalidOperationError } from '~/errors'

import Base from './base'

export default ({ config, db, basicAuthenticationMapping }) => {
  const service = Base({ config, db })

  if (!_.isObject(basicAuthenticationMapping)) {
    throw new InvalidOperationError('Missing required `basicAuthenticationMapping` configuration')
  }

  function _getPrivateKey() {
    const file = path.resolve('./keys/jwt.key')
    return fs.readFileSync(file, 'UTF8')
  }

  function generateUserCloudJWT(user) {
    const audience = process.env.AUTH0_JWKS_AUDIENCE || process.env.AUTH0_AUDIENCE
    const payload = {
      sub: user.username,
      nonce: nanoid()
    }

    const cert = _getPrivateKey()

    return jwt.sign(payload, cert, {
      algorithm: 'RS256',
      audience,
      issuer: process.env.AUTH0_JWKS_ISSUER || process.env.JWT_ISSUER,
      header: { kid: process.env.AUTH0_JWKS_KID }
    })
  }

  return Object.assign(service, { supportsBasicLogin: true })
}
