const axios = require('axios')

async function processIncoming() {
  const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
  const { data } = await axios.post('/mod/testing/incomingEvent', event, axiosConfig)

  if (data) {
    event.state = data
  }
}

return processIncoming()
