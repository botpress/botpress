const axios = require('axios')

/**
 * Creates an handoff for a given conversation. By default handoffs are unassigned, they can then be assigned to agents and resolved.
 *
 * @title Handoff
 * @category hitlnext
 * @description Transfers control of the conversation to an agent
 * @author Botpress, Inc.
 */
const escalate = async (event, timeoutDelay) => {
  // The HITLNext module is not compatible with the Converse API since the
  // former is asynchronous and the latter is synchronous.
  if (event.channel === 'api') {
    bp.logger
      .forBot(event.botId)
      .warn(
        "HITLNext: The event was created by the Converse API, it will be discarded (no handoff will be created) since it's incompatible with the module."
      )

    return
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post(
    '/mod/hitlnext/handoffs',
    {
      userThreadId: event.threadId,
      userId: event.target,
      userChannel: event.channel,
      timeoutDelay
    },
    axiosConfig
  )
}

return escalate(event, args.timeoutDelay)
