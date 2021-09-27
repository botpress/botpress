import { NLU, IO } from 'botpress/sdk'

export interface NLUProgressEvent {
  type: 'nlu'
  botId: string
  trainSession: NLU.TrainingSession
}

export type EventUnderstanding = IO.EventUnderstanding
export function mockEventUnderstanding(x?: Partial<EventUnderstanding>): EventUnderstanding {
  return {
    detectedLanguage: 'en',
    errored: false,
    includedContexts: [],
    language: 'en',
    ms: 1,
    ambiguous: false,
    entities: [],
    intent: { confidence: 1, context: 'context', name: 'name' },
    intents: [],
    predictions: {},
    slots: {},
    spellChecked: 'spellChecked',
    ...x
  }
}
