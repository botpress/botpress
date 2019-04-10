const axios = require('axios')

const updateContexts = async intentName => {
  const botId = event.botId
  const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
  const { data } = await axios.get(`/mod/nlu/intents/${intentName}`, axiosConfig)

  if (!event.state.session.nlu) {
    event.state.session.nlu = {
      contexts: data.contexts.join(',')
    }
  }
}

return updateContexts(args.intentName)
