import * as sdk from 'botpress/sdk'

import { extractListEntities, extractPatternEntities } from './pattern_extractor'

describe('Custom entity extraction', () => {
  test('Extract pattern entitites', () => {
    const pattern = 'lol'
    const entityDef = {
      id: '_',
      name: 'Fun',
      type: 'pattern',
      pattern,
    } as sdk.NLU.EntityDefinition
    const userInput = 'lollolppplol hello haha'

    const entities = extractPatternEntities(userInput, [entityDef])

    expect(entities.length).toEqual(3)
    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(0)
    expect(entities[0].meta.end).toEqual(2)
    expect(entities[0].data.value).toEqual(pattern)
    expect(entities[1].name).toEqual(entityDef.name)
    expect(entities[1].meta.start).toEqual(3)
    expect(entities[1].meta.end).toEqual(5)
    expect(entities[1].data.value).toEqual(pattern)
    expect(entities[2].name).toEqual(entityDef.name)
    expect(entities[2].meta.start).toEqual(9)
    expect(entities[2].meta.end).toEqual(11)
    expect(entities[2].data.value).toEqual(pattern)
  })

  test('Extract list entitites', () => {
    const entityDef = {
      id: '_',
      name: 'Fun',
      type: 'list',
      occurences: [
        {
          name: 'lol',
          synonyms: ['loll', 'haha', 'LMAO']
        }
      ]
    } as sdk.NLU.EntityDefinition
    const userInput = 'loLpppHahA so funny lmao!!!'

    const entities = extractListEntities(userInput, [entityDef])

    expect(entities.length).toEqual(3)

    expect(entities[0].name).toEqual(entityDef.name)
    expect(entities[0].meta.start).toEqual(0)
    expect(entities[0].meta.end).toEqual(2)
    expect(entities[0].meta.source).toEqual('loL')
    expect(entities[0].data.value).toEqual(entityDef.occurences![0].name)

    expect(entities[1].name).toEqual(entityDef.name)
    expect(entities[1].meta.start).toEqual(6)
    expect(entities[1].meta.end).toEqual(9)
    expect(entities[1].meta.source).toEqual('HahA')
    expect(entities[1].data.value).toEqual(entityDef.occurences![0].name)

    expect(entities[2].name).toEqual(entityDef.name)
    expect(entities[2].meta.start).toEqual(20)
    expect(entities[2].meta.end).toEqual(23)
    expect(entities[2].meta.source).toEqual('lmao')
    expect(entities[2].data.value).toEqual(entityDef.occurences![0].name)
  })
})
