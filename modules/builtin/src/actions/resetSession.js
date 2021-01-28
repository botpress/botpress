/**
 * Resets the user session. It clears information stored in `temp` and `session` storage for the user.
 *
 * NLU Contexts and Last messages history will not be removed.
 *
 * @title Reset Session
 * @category Storage
 * @author Botpress, Inc.
 */
const _ = require('lodash')
const PROPERTIES_TO_KEEP = ['lastMessages', 'nluContexts', 'workflows']

async function resetSession() {
  bp.logger.debug('inside reset')

  Object.keys(event.state.temp).forEach(property => {
    if (PROPERTIES_TO_KEEP.indexOf(property) < 0) {
      delete event.state.temp[property]
    }
  })

  Object.keys(event.state.session).forEach(property => {
    if (PROPERTIES_TO_KEEP.indexOf(property) < 0) {
      delete event.state.session[property]
    }
  })

  event.setFlag(bp.IO.WellKnownFlags.FORCE_PERSIST_STATE, true)
}

return resetSession()
