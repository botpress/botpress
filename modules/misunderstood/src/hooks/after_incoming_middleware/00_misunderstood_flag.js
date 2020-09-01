const axios = require('axios')
const _ = require('lodash')

const flag = async () => {
  const matchesQuickReply = async () => {
    const { currentFlow } = event.state.context
    if (currentFlow && currentFlow.startsWith('skills/choice')) {
      const flow = await bp.ghost.forBot(event.botId).readFileAsObject('flows', currentFlow)
      const preview = event.preview.toLowerCase()
      const kw = _.chain(flow.skillData.keywords)
        .values()
        .flatten()
        .find(kw => kw.toLowerCase() === preview.toLowerCase())
        .value()

      if (kw) {
        return true
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
