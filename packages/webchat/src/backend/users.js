import sillyname from 'sillyname'

module.exports = async bp => {
  const knex = bp.database.knex

  async function getOrCreateUser(userId, botId, throwIfNotFound = false) {
    const realUserId = userId.startsWith('webchat:') ? userId.substr(8) : userId

    const user = await knex('users')
      .where({
        platform: 'webchat',
        botId: botId,
        userId: realUserId
      })
      .then()
      .get(0)

    if (user) {
      return user
    }

    if (throwIfNotFound) {
      throw new Error(`User ${realUserId} not found`)
    }

    await createNewUser(realUserId)
    return getOrCreateUser(realUserId, true)
  }

  async function getUserProfile(userId, botId) {
    const realUserId = userId.startsWith('webchat:') ? userId.substr(8) : userId

    const user = await knex('users')
      .where({
        platform: 'webchat',
        botId,
        userId: realUserId
      })
      .then()
      .get(0)

    return user
  }

  function createNewUser(userId, botId) {
    const [first_name, last_name] = sillyname().split(' ')

    return bp.db.saveUser({
      first_name,
      botId,
      last_name,
      profile_pic: null,
      id: userId,
      platform: 'webchat'
    })
  }

  return { getOrCreateUser, getUserProfile } // FIXME Make part of Core (users_channels)
}
