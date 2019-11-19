/**
 * This is an example of how to use Recast NLU instead of Botpress NLU
 * To enable this, remove the 'dot' before the name of this file
 */

const axios = require('axios')

const RECAST_TOKEN = process.env.RECAST_TOKEN || '<<your recast token here>>'

const eventTypes = ['text'] // Process only 'text' events

async function recastExtract() {
  if (eventTypes.includes(event.type)) {
    const { data } = await axios.post(
      'https://api.recast.ai/train/v2/request',
      { text: event.preview },
      {
        headers: {
          Authorization: 'Token ' + RECAST_TOKEN
        }
      }
    )

    if (data && data.results) {
      /** TODO Here you will need to manipulate the format of these objects
       * so that they use the same format as Botpress NLU */
      event.nlu = event.nlu || {}
      event.nlu.intents = data.results.intents
      event.nlu.entities = data.results.entities
      event.nlu.language = data.results.language
      event.nlu.sentiment = data.results.sentiment
      // Disable Native NLU
      event.setFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU, true)
    }
  }
}

return recastExtract()
