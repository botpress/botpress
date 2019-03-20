import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import PatternExtractor from './pattern_extractor'

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

    const extractor = new PatternExtractor(Toolkit)

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

    const extractor = new PatternExtractor(Toolkit)
    const entities = await extractor.extractLists(userInput, 'en', [entityDef])

    expect(entities.length).toEqual(4)

    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(15)
    expect(entities[0].meta.end).toEqual(28)
    expect(entities[0].meta.source).toEqual('mercedes-benz')
    expect(entities[0].data.value).toEqual('Mercedes-Benz')

    expect(entities[1].name).toEqual(entityDef.name)
    expect(entities[1].meta.start).toEqual(86)
    expect(entities[1].meta.end).toEqual(94)
    expect(entities[1].meta.source).toEqual('mercedes')
    expect(entities[1].data.value).toEqual('Mercedes-Benz')

    expect(entities[2].name).toEqual(entityDef.name)
    expect(entities[2].meta.start).toEqual(67)
    expect(entities[2].meta.end).toEqual(69)
    expect(entities[2].meta.source).toEqual('BM')
    expect(entities[2].data.value).toEqual('BMW')

    expect(entities[3].name).toEqual(entityDef.name)
    expect(entities[3].meta.start).toEqual(136)
    expect(entities[3].meta.end).toEqual(140)
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

    const userInput = `
My name is kanye West and I rap like kanye wsest` /*
           [========]                [xxxxxxxxxx]
*/

    const extractor = new PatternExtractor(Toolkit)
    const entities = await extractor.extractLists(userInput, 'en', [entityDef])

    expect(entities.length).toEqual(1)

    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(12)
    expect(entities[0].meta.end).toEqual(22)
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

    const userInput = `
    I can't hear about Jone Goree anymore. Jone is a clown, so is gore` /*
                       [========]          [xx]                   [==]
*/

    const extractor = new PatternExtractor(Toolkit)
    const entities = await extractor.extractLists(userInput, 'en', [entityDef])

    expect(entities.length).toEqual(2)

    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(67)
    expect(entities[0].meta.end).toEqual(71)
    expect(entities[0].meta.source).toEqual('gore')
    expect(entities[0].data.value).toEqual('Jon Gore')

    expect(entities[1].name).toEqual(entityDef.name)
    expect(entities[1].meta.start).toEqual(24)
    expect(entities[1].meta.end).toEqual(34)
    expect(entities[1].meta.source).toEqual('Jone Goree')
    expect(entities[1].data.value).toEqual('Jon Gore')
  })
})
