const axios = require('axios')

const flag = async () => {
  if (event.type === 'text' && event.nlu.intent.name === 'none') {
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
