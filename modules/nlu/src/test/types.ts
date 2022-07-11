import { IO } from 'botpress/sdk'

// This function is located here because importing the SDK does not build in test files
export type EventUnderstanding = IO.EventUnderstanding

export function fakeEventUnderstanding(x?: Partial<EventUnderstanding>): EventUnderstanding {
  return {
    detectedLanguage: 'en',
    errored: false,
    includedContexts: x?.includedContexts || [],
    language: 'en',
    ms: 1,
    ambiguous: false,
    entities: x?.entities || [],
    intent: { confidence: 1, context: 'context', name: 'name', ...x?.intent },
    intents: x?.intents || [],
    predictions: { ...x?.predictions },
    slots: { ...x?.slots },
    spellChecked: 'spellChecked',
    modelId: 'testing',
    ...x
  }
}
