const _ = require('lodash')

// We get the intent name from the event
const intent = _.get(event, 'nlu.intent.name')

if (intent === 'login') {
  //We prepare the payload to send to the channel web
  const payload = {
    type: 'custom',
    module: 'custom-component',
    component: 'default',
    endpoint: 'http://google.com',

    // Let's send the internal ID to the custom component
    userId: event.target
  }

  // Note the array here, since you can send multiple payloads in the same reply
  bp.events.replyToEvent(event, [payload])
}
