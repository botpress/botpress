/**
 *
 * User info helper.
 *
 * This helper provides following methods:
 *
 *   - getOrFetchUserProfile: given `userId` return a promise of user data (with cache)
 *
 * Data users' profiles will be cached in `${bp.dataLocation}/botpress-slack.profiles.json`
 *
 */

const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')

module.exports = function(bp, slack) {
  const filename = path.join(bp.dataLocation, 'botpress-slack.profiles.json')

  const loadUserProfiles = () => {
    if (fs.existsSync(filename)) {
      return JSON.parse(fs.readFileSync(filename))
    }
    return {}
  }

  const saveUserProfiles = profiles => {
    const content = JSON.stringify(profiles)
    fs.writeFileSync(filename, content)
    bp.logger.debug('slack: saved user profiles to disk')
  }

  const userProfiles = loadUserProfiles()
  let cacheTs = new Date()

  return {
    getOrFetchUserProfile: Promise.method(userId => {
      if (userProfiles[userId]) {
        return userProfiles[userId]
      }

      return slack.getUserProfile(userId).then(user => {
        user.id = userId
        userProfiles[userId] = user

        if (new Date() - cacheTs >= 10000) {
          saveUserProfiles(userProfiles)
          cacheTs = new Date()
        }

        return bp.db
          .saveUser({
            id: user.id,
            platform: 'slack',
            gender: 'unknown',
            timezone: user.tz_offset / 3600,
            locale: 'en',
            picture_url: user.profile.image_512,
            first_name: user.profile.first_name,
            last_name: user.profile.last_name
          })
          .return(user)
      })
    })
  }
}
