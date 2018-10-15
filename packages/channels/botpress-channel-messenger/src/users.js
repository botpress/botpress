const _ = require('lodash')

module.exports = function(bp, messenger) {
  function profileToDbEntry(profile) {
    return {
      id: profile.id,
      platform: 'facebook',
      gender: profile.gender,
      timezone: profile.timezone,
      locale: profile.locale,
      picture_url: profile.profile_pic,
      first_name: profile.first_name,
      last_name: profile.last_name
    }
  }

  function dbEntryToProfile(db) {
    return {
      gender: db.gender,
      timezone: db.timezone,
      locale: db.locale,
      profile_pic: db.picture_url,
      first_name: db.first_name,
      last_name: db.last_name,
      id: db.userId
    }
  }

  async function getOrFetchUserProfile(userId, pageId, ignoreErrors) {
    const knex = await bp.db.get()

    const user = await knex('users')
      .where({ platform: 'facebook', userId: userId })
      .then()
      .get(0)
      .then()

    if (user) {
      return dbEntryToProfile(user)
    }

    const profile = Object.assign(await messenger.getUserProfile(userId, pageId, ignoreErrors), { id: userId })
    await bp.db.saveUser(profileToDbEntry(profile))

    return profile
  }

  async function getAllUsers() {
    const knex = await bp.db.get()

    const users = await knex('users')
      .where({ platform: 'facebook' })
      .then()

    return (users || []).map(dbEntryToProfile)
  }

  return { getOrFetchUserProfile, getAllUsers }
}
