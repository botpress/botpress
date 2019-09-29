const axios = require('axios')

const flag = async () => {
  if (event.type === 'text' && event.nlu.intent.name === 'none') {
    const data = {
      eventId: event.id,
      botId: event.botId,
      language: event.nlu.language !== 'n/a' ? event.nlu.language : event.state.user.language,
      preview: event.preview,
      reason: 'auto_hook'
    }

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    await axios.post('/mod/misunderstood/events', data, axiosConfig)
  }
}

return flag()
