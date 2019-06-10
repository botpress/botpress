export default [
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The incoming event object',
    parentObject: '',
    name: 'event',
    partial: true
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The canonical, textual representation of the message',
    parentObject: '',
    name: 'event.preview',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The channel on which the event was received',
    parentObject: '',
    name: 'event.channel',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The type of message received (e.g. "text", "typing" etc..)',
    parentObject: '',
    name: 'event.type',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The raw payload of the event received with all the properties',
    parentObject: '',
    name: 'event.payload',
    partial: true
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The type of payload',
    parentObject: '',
    name: 'event.payload.type',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The raw extracted information by the NLU engine',
    parentObject: '',
    name: 'event.nlu',
    partial: true
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The language code detected (e.g. "en", "fr", etc..)',
    parentObject: '',
    name: 'event.nlu.language',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'A dictionary of extracted slots from this message alone',
    parentObject: '',
    name: 'event.nlu.slots',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The primary user intent',
    parentObject: '',
    name: 'event.nlu.intent',
    partial: true
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The confidence of the NLU engine about this intent',
    parentObject: '',
    name: 'event.nlu.intent.confidence',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The name of the intent',
    parentObject: '',
    name: 'event.nlu.intent.name',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'The context under which this intent was detected',
    parentObject: '',
    name: 'event.nlu.intent.context',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'A sorted array of most likely intents detected',
    parentObject: '',
    name: 'event.nlu.intents',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'An array of all entities extracted from this event',
    parentObject: '',
    name: 'event.nlu.entities',
    partial: false
  },
  {
    category: 'PROPERTIES',
    source: 'Event properties',
    scope: 'inputs',
    description: 'An array of the contexts (strings) included by the engine',
    parentObject: '',
    name: 'event.nlu.includedContexts',
    partial: false
  }
]
