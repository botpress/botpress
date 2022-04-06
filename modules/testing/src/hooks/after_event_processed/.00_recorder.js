const axios = require('axios')

async function execute() {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    await axios.post('/mod/testing/processedEvent', event, axiosConfig)
  } catch (err) {
    console.error('Error processing', err.message)
  }
}

return execute()
