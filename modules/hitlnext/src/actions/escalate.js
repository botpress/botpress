const axios = require('axios')

/**
 * Creates an escalation for a given conversation. By default handoffs are unassigned, they can then be assigned to agents and resolved.
 *
 * @title Escalate
 * @category hitl2
 * @author Botpress, Inc.
 */
const escalate = async event => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post(
    '/mod/hitlnext/handoffs',
    {
      userThreadId: event.threadId,
      userId: event.target,
      userChannel: event.channel
    },
    axiosConfig
  )
}

return escalate(event)
