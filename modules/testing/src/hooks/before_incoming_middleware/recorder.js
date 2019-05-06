const axios = require('axios')

async function processIncoming() {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
    const { data } = await axios.post('/mod/testing/incomingEvent', event, axiosConfig)

    if (data) {
      event.state = data
    }
  } catch (err) {
    console.log('Error processing', err.message)
  }
}

return processIncoming()
