import ms from 'ms'
import helpers from '../database/helpers'
import moment from 'moment'
import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ db, botfile, middlewares }) => {
  let intervalRef = null

  const defaultJanitorInterval = ms(_.get(botfile, 'dialogs.janitorInterval', '30s'))
  const defaultTimeout = ms(_.get(botfile, 'dialogs.timeoutInterval', '15m'))

  const checkStaleSessions = async () => {
    const knex = await db.get()

    const timedOutCondition = helpers(knex).date.isBefore(
      'active_on',
      moment().subtract(defaultTimeout, 'milliseconds')
    )

    const sessions = await knex('dialog_sessions')
      .where(timedOutCondition)
      .andWhereRaw(`not "id" like '%\\_\\_\\_%' escape '\\'`) // Exclude substates
      .limit(250)
      .then()

    return Promise.map(sessions, session => {
      let platform = 'botpress'
      const props = {}
      const sessionId = session.id

      if (sessionId.includes(':')) {
        const chunks = sessionId.split(':')
        platform = _.head(chunks)
        const userId = _.tail(chunks).join(':')
        props.user = { id: userId }
      }

      return middlewares.sendIncoming({
        platform,
        type: 'bp_dialog_timeout',
        raw: { sessionId },
        text: sessionId,
        sessionId,
        ...props
      })
    })
  }

  const run = () => checkStaleSessions()

  const uninstall = () => {
    if (intervalRef) {
      clearInterval(intervalRef)
      intervalRef = null
    }
  }

  const install = () => {
    const randomMs = Math.random() * 5000

    if (intervalRef) {
      uninstall()
    }

    intervalRef = setInterval(run, defaultJanitorInterval + randomMs)
  }

  return { install, uninstall, runOnce: run }
}
