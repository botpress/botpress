/**
 * This is an example of how to use Rasa NLU instead of Botpress NLU
 * To enable this, remove the 'dot' before the name of this file
 */

const axios = require('axios')

const eventTypes = ['text'] // Process only 'text' events

async function rasaExtract() {
  if (eventTypes.includes(event.type)) {
    const { data } = await axios.post(
      'http://142.93.216.68:5000/parse',
      { q: event.preview }
	)
    if (data) {
      /** TODO Here you will need to manipulate the format of these objects
       * so that they use the same format as Botpress NLU */
      event.nlu = event.nlu || {}
      //event.nlu.intents = data.intent_ranking;
      event.nlu.intent = {};
      if(data.intent.name)
      	event.nlu.intent.name = data.intent.name;
      else
	event.nlu.intent.name = 'none'; 
      //event.nlu.entities = data.entities
      //event.nlu.language = data.results.language
      //event.nlu.sentiment = data.results.sentiment
      // Disable Native NLU
      event.setFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU, true)
    }
  }
}

return rasaExtract()
