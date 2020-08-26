const axios = require('axios')

const flag = async () => {
  const matchesQuickReply = async () => {
    const { currentFlow } = event.state.context
    if (currentFlow.startsWith('skills/choice')) {
      const flow = await bp.ghost.forBot(event.botId).readFileAsObject('flows', currentFlow)

      for (const kwList of Object.values(flow.skillData.keywords)) {
        for (const kw of kwList) {
          if (kw.toLowerCase() === event.preview.toLowerCase()) {
            bp.logger.info(
              `Misunderstood: event matches Choice Skill quick reply (preview: ${event.preview}, keyword: ${kw})`
            )
            return true
          }
        }
      }
    }

    return false
  }

  if (event.type === 'text' && event.nlu.intent.name === 'none' && !(await matchesQuickReply())) {
    const data = {
      eventId: event.id,
      botId: event.botId,
      language: [event.nlu.language, event.nlu.detectedLanguage, event.state.user.language].filter(
        l => l && l !== 'n/a'
      )[0],
      preview: event.preview,
      reason: 'auto_hook'
    }

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    await axios.post('/mod/misunderstood/events', data, axiosConfig)
  }
}

return flag()
