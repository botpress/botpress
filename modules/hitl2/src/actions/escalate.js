const axios = require('axios')

/**
 * Creates an unassigned escalation. Escalations can then be assigned and resolved by agents.
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
      userConversationId: event.threadId
    },
    axiosConfig
  )
}

return escalate(event)
