const defaultProperties = {
  category: 'PROPERTIES',
  source: 'Event properties',
  scope: 'inputs',
  parentObject: '',
  partial: false
}

export default [
  {
    description: 'The incoming event object',
    name: 'event',
    partial: true
  },
  {
    description: 'The canonical, textual representation of the message',
    name: 'event.preview'
  },
  {
    description: 'The channel on which the event was received',
    name: 'event.channel'
  },
  {
    description: 'The type of message received (e.g. "text", "typing" etc..)',
    name: 'event.type'
  },
  {
    description: 'The raw payload of the event received with all the properties',
    name: 'event.payload',
    partial: true
  },
  {
    description: 'The type of payload',
    name: 'event.payload.type'
  },
  {
    description: 'The raw extracted information by the NLU engine',
    name: 'event.nlu',
    partial: true
  },
  {
    description: 'The language code detected (e.g. "en", "fr", etc..)',
    name: 'event.nlu.language'
  },
  {
    description: 'A dictionary of extracted slots from this message alone',
    name: 'event.nlu.slots'
  },
  {
    description: 'The primary user intent',
    name: 'event.nlu.intent',
    partial: true
  },
  {
    description: 'The confidence of the NLU engine about this intent',
    name: 'event.nlu.intent.confidence'
  },
  {
    description: 'The name of the intent',
    name: 'event.nlu.intent.name'
  },
  {
    description: 'The context under which this intent was detected',
    name: 'event.nlu.intent.context'
  },
  {
    description: 'A sorted array of most likely intents detected',
    name: 'event.nlu.intents'
  },
  {
    description: 'An array of all entities extracted from this event',
    name: 'event.nlu.entities'
  },
  {
    description: 'An array of the contexts (strings) included by the engine',
    name: 'event.nlu.includedContexts'
  }
].map(hint => ({
  ...defaultProperties,
  ...hint
}))
