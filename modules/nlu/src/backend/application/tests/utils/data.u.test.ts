import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { ENGINE_SPECS } from './app-factory.u.test'
import { computeContentHash, computeSpecificationsHash } from './utils.u.test'

export interface Definitions {
  intentDefs: NLU.IntentDefinition[]
  entityDefs: NLU.EntityDefinition[]
}

interface Dataset {
  trainSet: NLU.TrainingSet
  modelId: NLU.ModelId
}

const utts = {
  en: ['hey', 'hello man', 'hi', 'whatsup'],
  fr: ['héhé', 'allo', 'salut', 'ça va?']
}

export const makeDefinitions = (langs: string[]): Definitions => {
  const supportedLangs = Object.keys(utts)
  if (_.intersection(supportedLangs, langs).length < langs.length) {
    throw new Error(`makeDataset only supports languages ${supportedLangs}.`)
  }

  const intent: NLU.IntentDefinition = {
    name: 'hello',
    contexts: ['global'],
    filename: 'who cares',
    slots: [],
    utterances: _.pick(utts, langs)
  }

  const entity: NLU.EntityDefinition = {
    name: 'fruits',
    id: 'list.fruits',
    type: 'list',
    fuzzy: 1,
    examples: ['banana', 'blueberry']
  }

  const intentDefs = [intent]
  const entityDefs = [entity]
  return {
    intentDefs,
    entityDefs
  }
}

export const makeDatasets = (langs: string[], seed = 42): Dataset[] => {
  const { intentDefs, entityDefs } = makeDefinitions(langs)

  return langs.map(languageCode => {
    const trainSet: NLU.TrainingSet = {
      entityDefs,
      intentDefs,
      languageCode,
      seed
    }

    const contentHash = computeContentHash(entityDefs, intentDefs, languageCode)
    const specificationHash = computeSpecificationsHash(ENGINE_SPECS)
    const modelId: NLU.ModelId = {
      contentHash,
      specificationHash,
      languageCode,
      seed
    }

    return {
      trainSet,
      modelId
    }
  })
}
