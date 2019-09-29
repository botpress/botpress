const axios = require('axios')

/**
 *
 * @title Flags message as misunderstood
 * @category Misunderstood Phrases
 * @author Botpress, Inc.
 */
const flag = async () => {
  const data = {
    eventId: event.id,
    botId: event.botId,
    language: event.nlu.language !== 'n/a' ? event.nlu.language : event.state.user.language,
    preview: event.preview,
    reason: 'action'
  }

  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
  await axios.post('/mod/misunderstood/events', data, axiosConfig)
}

return flag()
