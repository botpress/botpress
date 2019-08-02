import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { initNLUStruct } from '../../pipeline-manager'
import { makeTokens } from '../../tools/token-utils'
import { LanguageProvider, NLUHealth } from '../../typings'

import PatternExtractor from './pattern_extractor'

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
        .map(x => '\u2581' + x.toLowerCase())
    )

    return Promise.resolve(res)
  },
  generateSimilarJunkWords: (tokens: string[], lang: string) => Promise.resolve([]), // Not implemented
  getHealth: (): Partial<NLUHealth> => {
    return {}
  }
}

describe('Custom entity extraction', () => {
  require('../../../../../../src/bp/import-rewire')

  const { default: computeLevenshteinDistance } = require('../../../../../../src/bp/ml/homebrew/levenshtein')
  const { default: computeJaroWinklerDistance } = require('../../../../../../src/bp/ml/homebrew/jaro-winkler')
  const Toolkit = { Strings: { computeLevenshteinDistance, computeJaroWinklerDistance } } as any

  test('Extract pattern entities', async () => {
    const pattern = 'lol'
    const entityDef = {
      id: '_',
      name: 'Fun',
      type: 'pattern',
      pattern
    } as sdk.NLU.EntityDefinition
    const userInput = 'lollolppplol hello haha'

    const extractor = new PatternExtractor(Toolkit, languageProvider)

    const entities = await extractor.extractPatterns(userInput, [entityDef])

    expect(entities.length).toEqual(3)
    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(0)
    expect(entities[0].meta.end).toEqual(3)
    expect(entities[0].data.value).toEqual(pattern)
    expect(entities[1].name).toEqual(entityDef.name)
    expect(entities[1].meta.start).toEqual(3)
    expect(entities[1].meta.end).toEqual(6)
    expect(entities[1].data.value).toEqual(pattern)
    expect(entities[2].name).toEqual(entityDef.name)
    expect(entities[2].meta.start).toEqual(9)
    expect(entities[2].meta.end).toEqual(12)
    expect(entities[2].data.value).toEqual(pattern)
  })

  describe('List Entities', () => {
    test('Extract fuzzy list entities', async () => {
      const entityDef = {
        id: '_',
        name: 'Cars',
        type: 'list',
        fuzzy: true,
        occurences: [
          {
            name: 'Mercedes-Benz',
            synonyms: ['Benz', 'Mercedez Benz', 'Mercedez', 'Merc']
          },
          {
            name: 'BMW',
            synonyms: ['bm']
          }
        ]
      } as sdk.NLU.EntityDefinition

      const userInput = `
I'm riding my mercedes-benz to the dealership then I will take my BM to buy an other mercedes because we need merchandise for the shop BMW!` /*
              [============]                                      ==                 [======]                                          [=]
*/

      const extractor = new PatternExtractor(Toolkit, languageProvider)

      const sanitized = userInput.replace('\n', '')
      const ds = initNLUStruct(sanitized, [], ['global'])
      ds.sanitizedText = sanitized
      ds.sanitizedLowerText = sanitized.toLowerCase()
      const [stringTokens] = await languageProvider.tokenize([sanitized], 'en')
      ds.tokens = makeTokens(stringTokens, sanitized)

      const entities = await extractor.extractLists(ds, [entityDef])

      expect(entities.length).toEqual(4)

      expect(entities[0].name).toEqual(entityDef.name)
      expect(entities[0].meta.start).toEqual(14)
      expect(entities[0].meta.end).toEqual(27)
      expect(entities[0].meta.source).toEqual('mercedes-benz')
      expect(entities[0].data.value).toEqual('Mercedes-Benz')

      expect(entities[1].name).toEqual(entityDef.name)
      expect(entities[1].meta.start).toEqual(85)
      expect(entities[1].meta.end).toEqual(93)
      expect(entities[1].meta.source).toEqual('mercedes')
      expect(entities[1].data.value).toEqual('Mercedes-Benz')

      expect(entities[2].name).toEqual(entityDef.name)
      expect(entities[2].meta.start).toEqual(66)
      expect(entities[2].meta.end).toEqual(68)
      expect(entities[2].meta.source).toEqual('BM')
      expect(entities[2].data.value).toEqual('BMW')

      expect(entities[3].name).toEqual(entityDef.name)
      expect(entities[3].meta.start).toEqual(135)
      expect(entities[3].meta.end).toEqual(139)
      expect(entities[3].meta.source).toEqual('BMW!')
      expect(entities[3].data.value).toEqual('BMW')
    })

    test('Extract exact list entities', async () => {
      const entityDef = {
        id: '_',
        name: 'Artists',
        type: 'list',
        fuzzy: false,
        occurences: [
          {
            name: 'Kanye West',
            synonyms: ['Ye']
          }
        ]
      } as sdk.NLU.EntityDefinition

      const userInput = `My name is kanye West and I rap like kanye wsest`
      //                            [========]                [xxxxxxxxxx]

      const extractor = new PatternExtractor(Toolkit, languageProvider)
      const sanitized = userInput.replace('\n', '')
      const ds = initNLUStruct(sanitized, [], ['global'])
      ds.sanitizedText = sanitized
      ds.sanitizedLowerText = sanitized.toLowerCase()
      ds.language = 'en'
      const [stringTokens] = await languageProvider.tokenize([sanitized], 'en')
      ds.tokens = makeTokens(stringTokens, sanitized)

      const entities = await extractor.extractLists(ds, [entityDef])

      expect(entities.length).toEqual(1)

      expect(entities[0].name).toEqual(entityDef.name)
      expect(entities[0].meta.start).toEqual(11)
      expect(entities[0].meta.end).toEqual(21)
      expect(entities[0].meta.source).toEqual('kanye West')
      expect(entities[0].data.value).toEqual('Kanye West')
    })

    test('Extract fuzzy entities with synonyms not treated as fuzzy', async () => {
      const entityDef = {
        id: '_',
        name: 'People',
        type: 'list',
        fuzzy: true,
        occurences: [
          {
            name: 'Jon Gore',
            synonyms: ['Jon', 'Gore']
          }
        ]
      } as sdk.NLU.EntityDefinition

      const userInput = `I can't hear about Jone Goree anymore. Jone is a clown, so is gore`
      //                                    [========]          [xx]                   [==]

      const extractor = new PatternExtractor(Toolkit, languageProvider)
      const sanitized = userInput.replace('\n', '')
      const ds = initNLUStruct(sanitized, [], ['global'])
      ds.sanitizedText = sanitized
      ds.sanitizedLowerText = sanitized.toLowerCase()
      ds.language = 'en'
      const [stringTokens] = await languageProvider.tokenize([sanitized], 'en')
      ds.tokens = makeTokens(stringTokens, sanitized)

      const entities = await extractor.extractLists(ds, [entityDef])

      expect(entities.length).toEqual(2)

      expect(entities[0].name).toEqual(entityDef.name)
      expect(entities[0].meta.start).toEqual(62)
      expect(entities[0].meta.end).toEqual(66)
      expect(entities[0].meta.source).toEqual('gore')
      expect(entities[0].data.value).toEqual('Jon Gore')

      expect(entities[1].name).toEqual(entityDef.name)
      expect(entities[1].meta.start).toEqual(19)
      expect(entities[1].meta.end).toEqual(29)
      expect(entities[1].meta.source).toEqual('Jone Goree')
      expect(entities[1].data.value).toEqual('Jon Gore')
    })

    test('Extract the biggest match', async () => {
      const entityDef = {
        id: '_',
        name: 'numbers',
        type: 'list',
        fuzzy: true,
        occurences: [
          {
            name: 'one',
            synonyms: ['two', 'three', 'one two', 'two three', 'one two three']
          }
        ]
      } as sdk.NLU.EntityDefinition

      const userInput = `three two one one two tree`
      //                 [xxx] [x] [x] [----------]

      const extractor = new PatternExtractor(Toolkit, languageProvider)
      const sanitized = userInput.replace('\n', '')
      const ds = initNLUStruct(sanitized, [], ['global'])
      ds.sanitizedText = sanitized
      ds.sanitizedLowerText = sanitized.toLowerCase()
      ds.language = 'en'
      const [stringTokens] = await languageProvider.tokenize([sanitized], 'en')
      ds.tokens = makeTokens(stringTokens, sanitized)

      const entities = await extractor.extractLists(ds, [entityDef])

      expect(entities.length).toEqual(4)

      expect(entities[0].name).toEqual(entityDef.name)
      expect(entities[0].meta.start).toEqual(0)
      expect(entities[0].meta.end).toEqual(5)
      expect(entities[0].meta.source).toEqual('three')
      expect(entities[0].data.value).toEqual('one')

      expect(entities[1].name).toEqual(entityDef.name)
      expect(entities[1].meta.start).toEqual(6)
      expect(entities[1].meta.end).toEqual(9)
      expect(entities[1].meta.source).toEqual('two')
      expect(entities[1].data.value).toEqual('one')

      expect(entities[2].name).toEqual(entityDef.name)
      expect(entities[2].meta.start).toEqual(10)
      expect(entities[2].meta.end).toEqual(13)
      expect(entities[2].meta.source).toEqual('one')
      expect(entities[2].data.value).toEqual('one')

      expect(entities[3].name).toEqual(entityDef.name)
      expect(entities[3].meta.start).toEqual(14)
      expect(entities[3].meta.end).toEqual(26)
      expect(entities[3].meta.source).toEqual('one two tree')
      expect(entities[3].data.value).toEqual('one')
    })
  })
})
