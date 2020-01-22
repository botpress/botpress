import { LATIN_CHARSET } from './chars'
import {
  isWord,
  makeTokens,
  mergeSimilarCharsetTokens,
  mergeSpecialCharactersTokens,
  processUtteranceTokens,
  restoreOriginalUtteranceCasing,
  SPACE
} from './token-utils'

test('isWord', () => {
  expect(isWord('lol123')).toBeTruthy()
  expect(isWord('hey 123')).toBeFalsy()
  expect(isWord('!')).toBeFalsy()
  expect(isWord('^jo!')).toBeFalsy()
  expect(isWord('?¿')).toBeFalsy()
})

// We might want to get rid of this once engine2 is done
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

// TODO remove this once engine 2 is done
describe('Token Merging', () => {
  test('Merge special Characters with numbers should merge all consecutive numbers', async () => {
    // arrange
    const text = '1234vanillaIce#4321'
    const stringTokens = [SPACE + '1', '23', '4', 'vanilla', 'ice', '#', '43', '2', '1']
    const tokens = makeTokens(stringTokens, text)

    const numbers = '0123456789'.split('')

    // act
    const actualTokens = mergeSpecialCharactersTokens(tokens, numbers)

    // assert
    const expectedTokens = [SPACE + '1234vanillaice', '#', '4321'] // merging latin-based tokens only, merge only numbers
    expect(actualTokens.map(t => t.value)).toEqual(expectedTokens)
  })

  test('Merge special Characters with pipes should merge all consecutive pipes', async () => {
    // arrange
    const text = '|||yes|||yes|||yes|||'
    const base = ['yes', '|', '|', '|']
    const stringTokens = [SPACE + '|', '|', '|', ...base, ...base, ...base]
    const tokens = makeTokens(stringTokens, text)

    // act
    const actualTokens = mergeSpecialCharactersTokens(tokens, ['|'])

    // assert
    const expectedTokens = [SPACE + '|||', 'yes', '|||', 'yes', '|||', 'yes', '|||']
    expect(actualTokens.map(t => t.value)).toEqual(expectedTokens)
  })
})

describe('Raw token processing', () => {
  test('mergeSimilarTokens', () => {
    expect(mergeSimilarCharsetTokens(['_', '__', '_', 'abc'], ['_'])).toEqual(['____', 'abc'])
    expect(mergeSimilarCharsetTokens(['13', 'lo', '34', '56'], ['[0-9]'])).toEqual(['13', 'lo', '3456'])
    expect(mergeSimilarCharsetTokens(['ab', '34', '4f6', '4'], ['[a-z]', '[0-9]'])).toEqual(['ab344f64'])
    expect(mergeSimilarCharsetTokens(['gsa', '2', '3', 'he', '1', 'helko', '34', '56', '7'], ['[0-9]'])).toEqual([
      'gsa',
      '23',
      'he',
      '1',
      'helko',
      '34567'
    ])
    expect(
      mergeSimilarCharsetTokens(['#$', '^&', '!)'], '\\!,\\@,\\#,\\$,\\%,\\?,\\^,\\&,\\*,\\(,\\)'.split(','))
    ).toEqual(['#$^&!)'])
    expect(mergeSimilarCharsetTokens(['lol', 'ha', 'ha', 'nop', 'funny'], ['lol', 'ha', 'funny'])).toEqual([
      'lolhaha',
      'nop',
      'funny'
    ])
    expect(
      mergeSimilarCharsetTokens(
        ['ce', 'ci', 'est', 'très', SPACE, 'vanil', 'lé', '#', '12', '3', 'bås', 'Stra', 'ße'],
        LATIN_CHARSET
      )
    ).toEqual(['ceciesttrès', SPACE, 'vanillé', '#', '123båsStraße'])
  })

  test('mergeSimilarTokens with custom matcher', () => {
    expect(
      mergeSimilarCharsetTokens(['ce', 'ci', 'est', 'très', 'vanil', 'lé'], LATIN_CHARSET, t => t !== 'ce')
    ).toEqual(['ce', 'ciesttrèsvanillé'])

    const notInVocab = t => !{ ce: 1, ci: 1 }[t]
    expect(mergeSimilarCharsetTokens(['ce', 'ci', 'est', 'très', 'vanil', 'lé'], LATIN_CHARSET, notInVocab)).toEqual([
      'ce',
      'ci',
      'esttrèsvanillé'
    ])
  })

  test('processUtteranceTokens', () => {
    const toks = [
      `${SPACE}my`,
      `${SPACE}name`,
      `${SPACE}${SPACE}${SPACE}`,
      `${SPACE}is`,
      `${SPACE}34`,
      '98',
      `${SPACE}98`,
      `${SPACE}Hei`,
      'Sen',
      'berg',
      `!&$`,
      `!¿}{@~`
    ]

    expect(processUtteranceTokens(toks)).toEqual([
      'my',
      '▁',
      'name',
      '▁▁▁▁',
      'is',
      '▁',
      '3498',
      '▁',
      '98',
      '▁',
      'HeiSenberg',
      '!&$!¿}{@~'
    ])

    const moreToks = [`${SPACE}jag`, `${SPACE}ä`, `r`, `${SPACE}väl`, `digt`, `${SPACE}hungrig`]
    expect(processUtteranceTokens(moreToks)).toEqual(['jag', SPACE, 'är', SPACE, 'väldigt', SPACE, 'hungrig'])
  })

  test('restoreUtteranceTokens', () => {
    const original = 'I left NASA to work at Botpress'
    const tokens = ['i', SPACE, 'left', SPACE, 'nasa', SPACE, 'to', SPACE, 'work', SPACE, 'at', SPACE, 'bot', 'press']

    expect(restoreOriginalUtteranceCasing(tokens, original)).toEqual([
      'I',
      SPACE,
      'left',
      SPACE,
      'NASA',
      SPACE,
      'to',
      SPACE,
      'work',
      SPACE,
      'at',
      SPACE,
      'Bot',
      'press'
    ])
  })
})
