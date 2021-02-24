import Joi, { validate } from 'joi'
import { modelSchema as exactMatchModelSchema, Model as ExactMatchModel } from './exact-intent-classifier'
import { modelSchema as oosModelSchema, Model as OOSModel } from './oos-intent-classfier'
import { modelSchema as svmModelSchema, Model as SVMModel } from './svm-intent-classifier'

import { modelSchema as slotModelSchema, Model as SlotModel } from '../slots/slot-tagger'

const expectValidates = async (model: any, schema: Joi.ObjectSchema) => {
  await expect(validate(model, schema)).resolves.not.toThrow()
}

const expectThrows = async (model: any, schema: Joi.ObjectSchema) => {
  await expect(validate(model, schema)).rejects.toThrow()
}

test('exact-match intent clf model validation', async () => {
  const shouldPass: ExactMatchModel[] = [
    {
      intents: [],
      exact_match_index: {}
    },
    {
      intents: ['some_name', 'another_name'],
      exact_match_index: {
        aaaaaaaaa: { intent: 'some_name' },
        bbbbbbbbb: { intent: 'some_name' },
        ccccccccc: { intent: 'another_name' }
      }
    }
  ]

  const shouldFail = [
    undefined,
    null,
    {},
    {
      intents: []
    },
    {
      exact_match_index: {}
    },
    {
      intents: undefined,
      exact_match_index: {}
    },
    {
      intents: [],
      exactMatchIndex: {}
    },
    {
      intents: [],
      exact_match_index: {},
      exactMatchIndex: {}
    },
    {
      intents: [],
      exact_match_index: {
        aaaaaaaaa: { intent: '' } // empty intent name
      }
    }
  ]

  await Promise.map(shouldPass, m => expectValidates(m, exactMatchModelSchema))
  await Promise.map(shouldFail, m => expectThrows(m, exactMatchModelSchema))
})

test('oos intent clf model validation', async () => {
  const shouldPass: OOSModel[] = [
    {
      baseIntentClfModel: '',
      exactMatchModel: '',
      oosSvmModel: '',
      trainingVocab: []
    },
    {
      baseIntentClfModel: '',
      exactMatchModel: '',
      oosSvmModel: undefined,
      trainingVocab: []
    }
  ]

  const shouldFail = [
    undefined,
    null,
    {},
    {
      baseIntentClfModel: undefined,
      exactMatchModel: '',
      oosSvmModel: '',
      trainingVocab: []
    },
    {
      baseIntentClfModel: '',
      exactMatchModel: undefined,
      oosSvmModel: undefined,
      trainingVocab: []
    },
    {
      baseIntentClfModel: '',
      exactMatchModel: '',
      oosSvmModel: undefined,
      trainingVocab: undefined
    },
    {
      baseIntentClfModel: '',
      exactMatchModel: '',
      oosSvmModel: undefined,
      trainingVocab: undefined
    },
    {
      baseIntentClfModel: '',
      exactMatchModel: '',
      oosSvmModel: undefined
      // missing key
    }
  ]
  await Promise.map(shouldPass, m => expectValidates(m, oosModelSchema))
  await Promise.map(shouldFail, m => expectThrows(m, oosModelSchema))
})

test('svm intent clf model validation', async () => {
  const shouldPass: SVMModel[] = [
    {
      svmModel: '',
      intentNames: [],
      entitiesName: []
    },
    {
      svmModel: undefined,
      intentNames: [],
      entitiesName: []
    }
  ]

  const shouldFail = [
    undefined,
    null,
    {},
    {
      svmModel: '',
      intentNames: undefined,
      list_entities: [],
      pattern_entities: []
    },
    {
      svmModel: undefined,
      intentNames: [],
      list_entities: undefined,
      pattern_entities: []
    },
    {
      svmModel: '',
      intentNames: [],
      list_entities: [],
      pattern_entities: undefined
    },
    {
      svmModel: undefined,
      intentNames: [],
      list_entities: [],
      pattern_entities: [],
      someExtraKey: 42
    },
    {
      svmModel: undefined,
      intentNames: [],
      list_entities: []
      // missing key
    }
  ]

  await Promise.map(shouldPass, m => expectValidates(m, svmModelSchema))
  await Promise.map(shouldFail, m => expectThrows(m, svmModelSchema))
})

test('slot tagger model validation', async () => {
  const shouldPass: SlotModel[] = [
    {
      crfModel: Buffer.from(''),
      intentFeatures: {
        name: 'someIntent',
        slot_entities: [],
        vocab: []
      },
      slot_definitions: []
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: [],
        vocab: []
      },
      slot_definitions: []
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: ['entity'],
        vocab: ['']
      },
      slot_definitions: [{ name: 'some-name', entities: ['entity'] }]
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: ['entity'],
        vocab: ['']
      },
      slot_definitions: [{ name: 'some-name', entities: ['entity'] }]
    }
  ]

  const shouldFail = [
    undefined,
    null,
    {},
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: []
        // missing key
      },
      slot_definitions: []
    },
    {
      crfModel: undefined,
      intentFeatures: {},
      slot_definitions: []
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: ['entity'],
        vocab: ['']
      },
      slot_definitions: undefined
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: [],
        vocab: []
      },
      slot_definitions: [],
      someExtraKey: 42
    },
    {
      crfModel: undefined,
      intentFeatures: {
        name: 'someIntent',
        slot_entities: [],
        vocab: []
      },
      slot_definitions: [undefined],
      someExtraKey: 42
    }
  ]

  await Promise.map(shouldPass, m => expectValidates(m, slotModelSchema))
  await Promise.map(shouldFail, m => expectThrows(m, slotModelSchema))
})
