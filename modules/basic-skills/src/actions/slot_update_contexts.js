const axios = require('axios')

/**
 * Update the session nluContexts for a specific intent
 * @hidden true
 * @param intentName The name of the intent to get contexts from
 */
const updateContexts = async intentName => {
  const botId = event.botId
  const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
  const { data } = await axios.get(`/nlu/intents/${intentName}`, axiosConfig)

  const nluContexts = data.contexts.map(context => {
    return {
      context,
      ttl: 1000
    }
  })
  event.state.session.nluContexts = nluContexts
  temp.tryFillSlotCount = 1
  temp.extracted = false
  temp.notExtracted = false
  temp.valid = undefined
  temp.alreadyExtracted = false
}

return updateContexts(args.intentName)
