import * as sdk from 'botpress/sdk'

import { extractPatternEntities } from './patternExtractor'

describe('Entity pattern extraction', () => {
  test('Extract pattern entitites', () => {
    const pattern = 'lol'
    const entityDef = {
      id: '_',
      name: 'Fun',
      type: 'pattern',
      pattern,
    } as sdk.NLU.EntityDefinition
    const userInput = 'lollolppplol hello haha'

    const matches = extractPatternEntities(userInput, [entityDef])

    expect(matches.length).toEqual(3)
    expect(matches[0].name).toEqual(entityDef.name)
    expect(matches[0].meta.start).toEqual(0)
    expect(matches[0].meta.end).toEqual(2)
    expect(matches[0].data.value).toEqual(pattern)
    expect(matches[1].name).toEqual(entityDef.name)
    expect(matches[1].meta.start).toEqual(3)
    expect(matches[1].meta.end).toEqual(5)
    expect(matches[1].data.value).toEqual(pattern)
    expect(matches[2].name).toEqual(entityDef.name)
    expect(matches[2].meta.start).toEqual(9)
    expect(matches[2].meta.end).toEqual(11)
    expect(matches[2].data.value).toEqual(pattern)
  })
})
