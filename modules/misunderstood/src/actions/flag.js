const axios = require('axios')

/**
 *
 * @title Flags message as misunderstood
 * @category Misunderstood Phrases
 * @author Botpress, Inc.
 */
const flag = async () => {
  const { language, detectedLanguage } = event.nlu

  const data = {
    eventId: event.id,
    botId: event.botId,
    language: [language, detectedLanguage, event.state.user.language].filter(l => l && l !== 'n/a')[0],
    preview: event.preview,
    reason: 'action'
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post('/mod/misunderstood/events', data, axiosConfig)
}

return flag()
