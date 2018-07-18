import sillyname from 'sillyname'
import LRU from 'lru-cache'

import { sanitizeUserId } from './util'

const USERS_CACHE_SIZE = 1000

module.exports = async bp => {
  const knex = await bp.db.get()

  const knownUsersCache = LRU(USERS_CACHE_SIZE)

  const createNewUser = userId => {
    const [first_name, last_name] = sillyname().split(' ')

    return bp.db.saveUser({
      first_name,
      last_name,
      profile_pic: null,
      id: userId,
      platform: 'webchat'
    })
  }

  const getOrCreateUser = async userId => {
    userId = sanitizeUserId(userId)

    let user = await knex('users')
      .where({
        platform: 'webchat',
        userId
      })
      .then()
      .get(0)

    if (!user) {
      try {
        user = createNewUser(userId)
      } catch (err) {
        bp.logger.error(err.message, err.stack)
        throw new Error(`User ${userId} not found`)
      }
    }

    knownUsersCache.set(userId, true)
    return user
  }

  async function getUserProfile(userId) {
    const realUserId = userId.startsWith('webchat:') ? userId.substr(8) : userId

    const user = await knex('users')
      .where({
        platform: 'webchat',
        userId: realUserId
      })
      .then()
      .get(0)

    return user
  }

  const ensureUserExists = async userId => {
    userId = sanitizeUserId(userId)
    if (knownUsersCache.has(userId)) {
      return
    }
    await getOrCreateUser(userId)
    knownUsersCache.set(userId, true)
  }

  return { getOrCreateUser, getUserProfile, ensureUserExists }
}
