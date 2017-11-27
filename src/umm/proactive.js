import util from 'util'

import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ sendBloc, db }) => {
  async function getUser(id) {
    const knex = await db.get()
    const users = await knex('users')
      .where(function() {
        if (id.indexOf(':') > 0) {
          this.where({ id: id })
        } else {
          this.where('userId', id)
        }
      })
      .limit(1)
      .select('*')

    if (!users || users.length <= 0) {
      throw new Error(`User "${id}" not found in the database`)
    }

    return users[0]
  }

  /**
   * Sends a proactive UMM message to a user
   * @param  {string|object} user UserId or a full user object
   * @param  {string} bloc The bloc name to send
   * @param  {object} data Additional data to provide to the bloc
   * @return {Promise}      A promise that the bloc is sent
   */
  async function sendToUser(user, bloc, data) {
    if (!_.isString(bloc)) {
      throw new Error('Invalid bloc id: ' + bloc)
    }

    if (_.isString(user)) {
      user = await getUser(user)
    }

    if (!user || !user.id) {
      throw new Error('Invalid user object: ' + util.inspect(user))
    }

    const text = 'This is not a real event, it has been forged by UMM.'
    const forgedEvent = {
      platform: user.platform,
      user: user,
      type: 'proactive',
      text: text,
      raw: { forged: true, message: text, to: user && user.id }
    }

    return sendBloc(forgedEvent, bloc, data)
  }

  return { sendToUser }
}
