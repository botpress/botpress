const axios = require('axios')

async function execute() {
  try {
    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId)
    await axios.post('/mod/extensions/saveIncoming', event, axiosConfig)
  } catch (err) {
    console.log('Error processing', err.message)
  }
}

return execute()
