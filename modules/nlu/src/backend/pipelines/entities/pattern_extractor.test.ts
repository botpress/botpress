import { extractPatternEntities } from './patternExtractor'

describe('Entity pattern extraction', () => {
  test('Exact match', () => {
    const pattern = new RegExp('lol')
    const matches = extractPatternEntities('lollolppplol', pattern)

    expect(matches.length).toEqual(3)
    expect(matches[0].meta.start).toEqual(0)
    expect(matches[0].meta.end).toEqual(2)
    expect(matches[0].data.value).toEqual('lol')
    expect(matches[1].meta.start).toEqual(3)
    expect(matches[1].meta.end).toEqual(5)
    expect(matches[1].data.value).toEqual('lol')
    expect(matches[2].meta.start).toEqual(9)
    expect(matches[2].meta.end).toEqual(11)
    expect(matches[2].data.value).toEqual('lol')
  })
})
