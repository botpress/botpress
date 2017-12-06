import ms from 'ms'
import helpers from '../database/helpers'
import moment from 'moment'
import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ db, botfile, middlewares }) => {
  let intervalRef = null

  const defaultJanitorInterval = ms(_.get(botfile, 'dialogs.janitorInterval') || '10s') // TODO
  const defaultTimeout = ms(_.get(botfile, 'dialogs.timeoutInterval') || '30s') // TODO

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
      let props = {}

      if (session.id.includes(':')) {
        const chunks = session.id.split(':')
        platform = _.head(chunks)
        const userId = _.tail(chunks).join(':')
        props.user = { id: userId }
      }

      return middlewares.sendIncoming(
        _.merge(
          {
            platform: platform,
            type: 'bp_dialog_timeout',
            raw: { sessionId: session.id },
            text: session.id,
            sessionId: session.id
          },
          props
        )
      )
    })
  }

  const run = async () => {
    await checkStaleSessions()
  }

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
