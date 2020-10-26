const axios = require('axios')

/**
 * Creates an escalation for a given conversation. By default escalations are unassigned, they can then be assigned to agents and resolved.
 *
 * @title Escalate
 * @category HITL
 * @author Botpress, Inc.
 */
const escalate = async event => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post(
    '/mod/hitl2/escalations',
    {
      userThreadId: event.threadId,
      userId: event.target
    },
    axiosConfig
  )
}

return escalate(event)
