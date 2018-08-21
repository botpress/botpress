import sillyname from 'sillyname'

module.exports = async bp => {
  const knex = await bp.db.get()

  async function getOrCreateUser(userId, throwIfNotFound = false) {
    const realUserId = userId.startsWith('webchat:') ? userId.substr(8) : userId

    const user = await knex('users')
      .where({
        platform: 'webchat',
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

  function createNewUser(userId) {
    const [first_name, last_name] = sillyname().split(' ')

    return bp.db.saveUser({
      first_name,
      last_name,
      profile_pic: null,
      id: userId,
      platform: 'webchat'
    })
  }

  return { getOrCreateUser, getUserProfile }
}
