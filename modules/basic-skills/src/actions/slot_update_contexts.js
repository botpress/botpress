const axios = require('axios')

/**
 * Update the session nluContexts for a specific intent
 * @hidden
 * @param intentName The name of the intent to get contexts from
 */
const updateContexts = async intentName => {
  const botId = event.botId
  const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
  const { data } = await axios.get(`/mod/nlu/intents/${intentName}`, axiosConfig)

  const nluContexts = data.contexts.map(context => {
    return {
      context,
      ttl: 1000
    }
  })
  event.state.session.nluContexts = nluContexts
}

return updateContexts(args.intentName)
