import sillyname from 'sillyname'

module.exports = async (bp, config) => {
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
      .then()

    if (!user) {
      if (throwIfNotFound) {
        throw new Error(`User ${realUserId} not found`)
      }

      await createNewUser(realUserId)
      return getOrCreateUser(realUserId, true)
    }

    return user
  }

  function createNewUser(userId) {
    const [first_name, last_name] = sillyname().split(' ')
    const user = {
      first_name: first_name,
      last_name: last_name,
      profile_pic: null,
      id: userId,
      platform: 'webchat'
    }

    return bp.db.saveUser(user)
  }

  async function patchUserInfo(userId, fields) {}

  return { getOrCreateUser }
}
