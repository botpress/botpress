import { makeTokens, mergeTokens, mergeSpecialCharactersTokens } from './token-utils'

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

describe('Token Merging', () => {
  test('Merge tokens with false predicate should return original array', async () => {
    // arrange
    const text = (
      "I don't want to be" +
      " Anything other than what I've been tryna be lately" +
      ' All I have to do' +
      ' Is think of me and I have peace of mind' +
      " I'm tired of looking 'round rooms" +
      " Wondering what I've got to do" +
      " Or who I'm supposed to be" +
      " I don't want to be anything other than me"
    ).toLowerCase()

    const tokens = makeTokens(text.split(' ').map(t => SPACE + t), text)

    // act
    const mergedTokens = mergeTokens(tokens, () => false)

    // assert
    expect(mergedTokens).toEqual(tokens)
  })

  test('Merge tokens with true predicate should return array of single element', async () => {
    // arrange
    const text = (
      'Que tout ceux qui sont dans la vibe' +
      ' Lèvent le doigt' +
      ' Que toutes celles qui sont dans la vibe' +
      ' Lèvent le doigt' +
      ' Que ceux qui sont assis se lèvent' +
      ' Suivent le pas' +
      ' Allez maintenant on y va'
    ).toLowerCase()

    const tokens = makeTokens(text.split(' ').map(t => SPACE + t), text)

    // act
    const mergedTokens = mergeTokens(tokens, () => true)

    // assert
    expect(mergedTokens).toHaveLength(1)

    const onlyToken = mergedTokens[0]
    expect(onlyToken.start).toEqual(0)
    expect(onlyToken.end).toEqual(text.length)
  })

  test('Merge tokens numbers together and letters together should return correct matched arrays', async () => {
    // arrange
    const text = 'frlev144'
    const stringTokens = [SPACE + 'f', 'r', 'lev', '1', '4', '4']
    const tokens = makeTokens(stringTokens, text)

    const isMergable = ({ value: t1 }: { value: string }, { value: t2 }: { value: string }) => {
      const isNumber = t => !isNaN(t)
      const bothAreNumbers = isNumber(t1) && isNumber(t2)
      const noneAreNumbers = !(isNumber(t1) || isNumber(t2))
      return bothAreNumbers || noneAreNumbers
    }

    // act
    const actualTokens = mergeTokens(tokens, isMergable)

    // assert
    const expectedTokens = [SPACE + 'frlev', '144']
    const expectedStarts = [0, 5]
    const expectedEnds = [5, 8]
    expect(actualTokens.map(t => t.value)).toEqual(expectedTokens)
    expect(actualTokens.map(t => t.start)).toEqual(expectedStarts)
    expect(actualTokens.map(t => t.end)).toEqual(expectedEnds)
  })

  test('Merge special Characters with numbers should merge all consecutive numbers', async () => {
    // arrange
    const text = '1234vanillaIce4321'
    const stringTokens = [SPACE + '1', '23', '4', 'vanilla', 'ice', '43', '2', '1']
    const tokens = makeTokens(stringTokens, text)

    const numbers = '0123456789'.split('')

    // act
    const actualTokens = mergeSpecialCharactersTokens(tokens, numbers)

    // assert
    const expectedTokens = [SPACE + '1234', 'vanilla', 'ice', '4321']
    expect(actualTokens.map(t => t.value)).toEqual(expectedTokens)
  })
})
