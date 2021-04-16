const speechToTextHook = async () => {
  const axios = require('axios')
  const text = event.payload.text

  if (text && text.length && text.includes('raw')) {
    const config = await bp.http.getAxiosConfigForBot(event.botId)

    try {
      const resp = await axios.post('mod/google-speech/speech-to-text', { mediaUrl: text }, config)

      event.payload = { type: 'text', text: resp.data.text }
    } catch (err) {
      bp.logger.error('Mod[GoogleSpeech] - API Error:', err)
    }
  }
}

return speechToTextHook()
