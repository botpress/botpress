import { makeTokens } from './make-tokens'

const SPACE = '\u2581'

describe('Tokens generation', () => {
  test('Make token objects from strings with sanitized text', async () => {
    // arrange
    const text = 'Never gonna let you Down'
    //            012345678901234567890123
    const stringTokens = ['never', 'gonna', 'let', 'you', 'down']

    // act
    const tokens = makeTokens(stringTokens, text)

    // assert
    expect(tokens).toHaveLength(5)

    const expectedStarts = [0, 6, 12, 16, 20]
    const actualStarts = tokens.map(t => t.start)
    expect(actualStarts).toEqual(expectedStarts)

    const expectedEnds = [5, 11, 15, 19, 24]
    const actualEnds = tokens.map(t => t.end)
    expect(actualEnds).toEqual(expectedEnds)
  })

  test('Make token objects from strings with sentencepiece like tokens', async () => {
    // arrange
    const text = 'Never gonna let you Down'
    //            012345678901234567890123
    const stringTokens = [`${SPACE}never`, `${SPACE}gon`, 'na', `${SPACE}let`, `${SPACE}you`, `${SPACE}down`] // \u2581 is ▁

    // act
    const tokens = makeTokens(stringTokens, text)

    // assert
    expect(tokens).toHaveLength(6)

    const expectedStarts = [0, 6, 9, 12, 16, 20]
    const actualStarts = tokens.map(t => t.start)
    expect(actualStarts).toEqual(expectedStarts)

    const expectedEnds = [5, 9, 11, 15, 19, 24]
    const actualEnds = tokens.map(t => t.end)
    expect(actualEnds).toEqual(expectedEnds)
  })
})
