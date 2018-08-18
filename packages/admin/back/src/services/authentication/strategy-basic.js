import _ from 'lodash'
import Promise from 'bluebird'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import nanoid from 'nanoid'

import { InvalidCredentialsError, InvalidOperationError } from '~/errors'

import Base from './base'
import TeamService from '../team'

const debug = require('debug')('svc:authentication')

const additionalOptions = {}

export default ({ config, db, basicAuthenticationFn, basicAuthenticationMapping, basicAuthenticationName }) => {
  const service = Base({ config, db })
  const team = TeamService({ config, db })

  if (!_.isObject(basicAuthenticationMapping)) {
    throw new InvalidOperationError('Missing required `basicAuthenticationMapping` configuration')
  }

  function _getPrivateKey() {
    const file = path.resolve('./keys/jwt.key')
    return fs.readFileSync(file, 'UTF8')
  }

  async function getOrCreateUser(remoteId) {
    const user = await db.models.user.findOne({ where: { remoteId } })

    if (!user) {
      throw new Error(`User "${remoteId}" not found`)
    }

    return user
  }

  async function createOrUpdateUser(userObject, ipAddress) {
    const { remoteId, fullname, firstname, lastname, picture, company, email, location } = userObject

    if (_.isEmpty(remoteId)) {
      const msg =
        'Retrieved remote user does not have a valid mapping for `remoteId`. This is most likely a configuration issue.'
      debug(msg)
      throw new InvalidOperationError(msg)
    }

    let user = await db.models.user.findOne({ where: { remoteId } })

    if (!user) {
      user = await db.models.user.create({ username: service.getRandomUsername(), remoteId })
    }

    const update = {
      fullName: fullname || firstname + ' ' + lastname,
      picture: picture || null,
      company: company || null,
      email: email,
      location: location || 'N/A',
      provider: basicAuthenticationName,
      lastSyncedAt: new Date()
    }

    if (!_.isEmpty(ipAddress)) {
      update.lastIp = ipAddress
    }

    return user.update(update)
  }

  function generateUserCloudJWT(user) {
    const expiresIn = '6h'
    const audience = process.env.AUTH0_JWKS_AUDIENCE || process.env.AUTH0_AUDIENCE
    const payload = {
      sub: user.username,
      nonce: nanoid()
    }

    const cert = _getPrivateKey()

    return jwt.sign(payload, cert, {
      algorithm: 'RS256',
      expiresIn,
      audience,
      issuer: process.env.AUTH0_JWKS_ISSUER || process.env.JWT_ISSUER,
      header: { kid: process.env.AUTH0_JWKS_KID }
    })
  }

  async function basicLogin(username, password, ipAddress = '') {
    try {
      const remoteUser = await basicAuthenticationFn(username, password)
      debug(`Successful authentication for "${username}"`)

      const mappedUser = _.mapValues(basicAuthenticationMapping, (value, key) => {
        if (value.startsWith('!')) {
          return value.substr(1)
        } else {
          return _.get(remoteUser, value)
        }
      })

      const user = await createOrUpdateUser(mappedUser, ipAddress)

      return await generateUserCloudJWT(user)
    } catch (err) {
      debug('Login error', err)
      throw new InvalidCredentialsError()
    }
  }

  return Object.assign(service, { getOrCreateUser, basicLogin, supportsBasicLogin: true })
}
