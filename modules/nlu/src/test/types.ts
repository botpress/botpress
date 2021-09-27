import { IO } from 'botpress/sdk'

/**
 * @description extending IO.EventUnderstanding as is is necessary in this context (nlu/backend/election) as the Typescript compiler doesn't allow me to import botpress/sdk in a test file
 * @todo fix Typescript configuration file to allow botpres/sdk import in test files
 */
export type EventUnderstanding = IO.EventUnderstanding

export function fakeEventUnderstanding(x?: Partial<EventUnderstanding>): EventUnderstanding {
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
