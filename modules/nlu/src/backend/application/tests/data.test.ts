import { NLU } from 'botpress/sdk'

import { ENGINE_SPECS } from './fake-engine.test'
import { computeContentHash, computeSpecificationsHash } from './utils.test'

export namespace train_data_en {
  export const lang = 'en'

  const intent: NLU.IntentDefinition = {
    name: 'hello',
    contexts: ['global'],
    filename: 'who cares',
    slots: [],
    utterances: {
      [lang]: ['hey', 'hello man', 'hi', 'whatsup']
    }
  }

  export const nluSeed = 42
  export const intents = [intent]
  export const entities = []

  const contentHash = computeContentHash(entities, intents, lang)
  const specificationHash = computeSpecificationsHash(ENGINE_SPECS)
  export const modelId: NLU.ModelId = {
    contentHash,
    specificationHash,
    languageCode: lang,
    seed: nluSeed
  }
}

export namespace train_data_en_fr {
  const intent: NLU.IntentDefinition = {
    name: 'hello',
    contexts: ['global'],
    filename: 'who cares',
    slots: [],
    utterances: {
      ['en']: ['hey', 'hello man', 'hi', 'whatsup'],
      ['fr']: ['bonjour', 'salut', 'ça va?', 'héhé']
    }
  }

  export const nluSeed = 42
  export const intents = [intent]
  export const entities = []

  const specificationHash = computeSpecificationsHash(ENGINE_SPECS)

  const frContentHash = computeContentHash(entities, intents, 'fr')
  export const frModel: NLU.ModelId = {
    contentHash: frContentHash,
    specificationHash,
    languageCode: 'fr',
    seed: nluSeed
  }

  const enContentHash = computeContentHash(entities, intents, 'en')
  export const enModel: NLU.ModelId = {
    contentHash: frContentHash,
    specificationHash,
    languageCode: 'en',
    seed: nluSeed
  }
}

test(__filename, () => {})
