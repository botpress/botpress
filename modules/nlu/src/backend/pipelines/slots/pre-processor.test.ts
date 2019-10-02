import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { createMockLogger } from '../../../../../../src/bp/core/misc/utils'
import { makeTokens, SPACE } from '../../tools/token-utils'
import { BIO, LanguageProvider, NLUHealth } from '../../typings'

import { generatePredictionSequence, generateTrainingSequence } from './pre-processor'

const AN_ENTITY = 'person'
const OTHER_ENTITY = 'animal'

const languageProvider: LanguageProvider = {
  vectorize: function(tokens: string[], lang: string): Promise<Float32Array[]> {
    const vectors = [Float32Array.from([1, 2, 3])]
    return Promise.resolve(vectors)
  },

  tokenize: function(utterances: string[], lang: string): Promise<string[][]> {
    // This is a white space tokenizer only working for tests written in english
    const res = utterances.map(text =>
      text
        .split(' ')
        .filter(_.identity)
        .map(x => SPACE + x)
    )

    return Promise.resolve(res)
  },

  generateSimilarJunkWords: (tokens: string[], lang: string) => Promise.resolve([]), // Not implemented

  getHealth: (): Partial<NLUHealth> => {
    return {}
  }
}

describe('Preprocessing', () => {
  const logger = createMockLogger()

  test('generate training seq', async () => {
    const slotDef = [
      {
        name: 'ME',
        entities: [AN_ENTITY],
        color: 1
      },
      {
        name: 'YOU',
        entities: [AN_ENTITY, OTHER_ENTITY],
        color: 2
      }
    ]
    const scopedGenerateTrainingSequence = generateTrainingSequence(languageProvider, logger)

    const trainingSeq = await scopedGenerateTrainingSequence(
      `hello my name is [Jacob Jacobson](${slotDef[0].name}) and your name is [Paul](${slotDef[1].name})`,
      'en',
      slotDef
    )

    expect(trainingSeq.cannonical).toEqual('hello my name is jacob jacobson and your name is paul')
    expect(trainingSeq.tokens.filter(t => t.tag != BIO.OUT).length).toEqual(3)
    expect(trainingSeq.tokens[0].slot).toEqual('')
    expect(trainingSeq.tokens[0].matchedEntities).toEqual([])
    expect(trainingSeq.tokens[0].tag).toEqual(BIO.OUT)
    expect(trainingSeq.tokens[0].value).toEqual(SPACE + 'hello')
    expect(trainingSeq.tokens[4].slot).toEqual(slotDef[0].name)
    expect(trainingSeq.tokens[4].matchedEntities).toEqual(slotDef[0].entities)
    expect(trainingSeq.tokens[4].tag).toEqual(BIO.BEGINNING)
    expect(trainingSeq.tokens[4].value).toEqual(SPACE + 'jacob')
    expect(trainingSeq.tokens[4].cannonical).toEqual('Jacob')
    expect(trainingSeq.tokens[5].slot).toEqual(slotDef[0].name)
    expect(trainingSeq.tokens[5].matchedEntities).toEqual(slotDef[0].entities)
    expect(trainingSeq.tokens[5].tag).toEqual(BIO.INSIDE)
    expect(trainingSeq.tokens[5].value).toEqual(SPACE + 'jacobson')
    expect(trainingSeq.tokens[10].matchedEntities).toEqual(slotDef[1].entities)
  })

  test('generate prediction seq', async () => {
    const entities = [
      {
        name: 'numeral',
        type: 'system',
        meta: {
          start: 26,
          end: 28,
          confidence: 1,
          provider: 'native',
          raw: {},
          source: '70'
        },
        data: {
          value: 70
        }
      },
      {
        name: 'amountOfMoney',
        type: 'system',
        meta: {
          start: 26,
          end: 36,
          confidence: 1,
          provider: 'native',
          raw: {},
          source: '70 dollars'
        },
        data: {
          unit: 'dollar',
          value: 70
        }
      },
      {
        name: 'email',
        type: 'system',
        meta: {
          start: 51,
          end: 70,
          confidence: 1,
          provider: 'native',
          raw: {},
          source: 'misterhyde@evil.com'
        },
        data: {
          value: 'misterhyde@evil.com'
        }
      }
    ] as sdk.NLU.Entity[]

    const intentDef = {
      name: 'a_name',
      slots: [
        {
          name: '1',
          entities: ['numeral']
        },
        {
          name: '2',
          entities: ['numeral', 'email']
        }
      ]
    } as sdk.NLU.IntentDefinition

    // weird spacing here is on purpose
    const input = 'Hey can you   please send 70 dollars to  Jekyll at misterhyde@evil.com'
    const tokens = await makeTokens((await languageProvider.tokenize([input], 'en'))[0], input)

    const testingSeq = await generatePredictionSequence(input, intentDef, entities, tokens)
    const entityTokens = testingSeq.tokens.filter(t => t.matchedEntities.length)

    expect(entityTokens.length).toEqual(2)
    expect(entityTokens[0].value).toEqual(SPACE + '70')
    // we want amountOfMoney to be filtered out because it's not any of the allowed entities in the intent
    expect(entityTokens[0].matchedEntities).toEqual(['numeral'])
    expect(entityTokens[1].value).toEqual(SPACE + 'misterhyde@evil.com')
    expect(entityTokens[1].matchedEntities).toEqual(['email'])
    expect(testingSeq.tokens[0].value).toEqual(SPACE + 'Hey')
    expect(testingSeq.tokens[0].matchedEntities).toEqual([])
  })
})
