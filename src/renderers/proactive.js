import util from 'util'

import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ sendContent, db }) => {
  const getUser = async id => {
    const knex = await db.get()
    const users = await knex('users')
      .where({ id: id })
      .orWhere('userId', id)
      .limit(1)
      .select('*')

    if (!users || users.length <= 0) {
      throw new Error(`User "${id}" not found in the database`)
    }

    return users[0]
  }

  /**
   * Proactively sends a user a message
   * @param  {string|object} user id or a full user object
   * @param  {string} elementOrRenderer The name of the renderer to use OR an element id
   * @param  {object} data Additionnal data that will be passed to the renderer
   * @async
   * @memberof! ContentRenderer
   */
  const sendToUser = async (user, elementOrRenderer, data) => {
    if (!_.isString(elementOrRenderer)) {
      throw new Error('Invalid renderer: ' + elementOrRenderer)
    }

    if (_.isString(user)) {
      user = await getUser(user)
    }

    if (!user || !user.id) {
      throw new Error('Invalid user object: ' + util.inspect(user))
    }

    const text = 'This is not a real event, it has been forged by proactive.'
    const forgedEvent = {
      platform: user.platform,
      user: user,
      type: 'proactive',
      text: text,
      raw: { forged: true, message: text, to: user && user.id }
    }

    return sendContent(forgedEvent, elementOrRenderer, data)
  }

  return { sendToUser }
}
