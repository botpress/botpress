import ms from 'ms'
import _ from 'lodash'
import moment from 'moment'

import { ManagementClient } from 'auth0'

import Base from './base'
import TeamService from '../team'

const debug = require('debug')('svc:authentication')

const SYNC_FREQUENCY_MS = ms(process.env.PROFILE_SYNC_FREQUENCY)

const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: 'read:users'
})

const getUserProfile = userId => {
  return auth0.getUser({ id: userId })
}

export default ({ config, db }) => {
  const service = Base({ config, db })
  const team = TeamService({ config, db })

  async function updateUserProfile(remoteId) {
    debug(`Updating user profile: ${remoteId}`)
    const az = await getUserProfile(remoteId)

    const user = await db.models.user.findOne({ where: { remoteId } })

    return user.update({
      fullName: az.name || 'Untitled',
      picture: az.picture || null,
      company: az.company || null,
      lastIp: az.last_ip,
      email: az.email,
      location: az.location || 'N/A',
      provider: (_.first(az.identities) || {}).provider || 'custom',
      lastSyncedAt: new Date()
    })
  }

  async function getOrCreateUser(remoteId) {
    let user = await db.models.user.findOne({ where: { remoteId } })

    if (user) {
      const threshold = moment().subtract(SYNC_FREQUENCY_MS, 'milliseconds')
      if (moment(user.lastSyncedAt).isAfter(threshold)) {
        return user
      } else {
        return updateUserProfile(remoteId)
      }
    }

    debug(`Creating user: ${remoteId}`)

    user = await db.models.user.create({ username: service.getRandomUsername(), remoteId })

    user = await updateUserProfile(remoteId)

    await team.createNewTeam({ userId: user.get('id'), name: `${user.fullName} Team` })

    return user
  }

  return Object.assign(service, { getOrCreateUser, supportsBasicLogin: false })
}
