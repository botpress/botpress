import ms from 'ms'
import helpers from '../database/helpers'
import moment from 'moment'
import _ from 'lodash'
import Promise from 'bluebird'

module.exports = ({ db, botfile, middlewares }) => {
  let intervalRef = null

  let defaultJanitorInterval = ms(process.env.BOTPRESS_DIALOG_JANITOR || '10s') // TODO

  const defaultTimeout = ms(_.get(botfile, 'dialogs.timeoutInterval') || '30s') // TODO

  const checkStaleSessions = async () => {
    console.log('Running') // TODO
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
      console.log(session, middlewares.sendOutgoing)

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

// Check every 1m if there's timed out tasks (1m + random [1-3000] milliseconds)
// Get the list of timed out sessions
// send a timeout middleware event

// engine handles the timeout event --> call the appropriate timeout node
// Goto current node timeout node
// Goto current flow timeout node
// Else, goto timeout node if any
// Else, goto timeout flow if any
// Else do nothing
