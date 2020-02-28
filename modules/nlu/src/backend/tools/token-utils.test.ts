import { LATIN_CHARSET } from './chars'
import {
  isWord,
  mergeSimilarCharsetTokens,
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
      mergeSimilarCharsetTokens(['ce', 'ci', 'est', 'très', 'vanil', 'lé'], LATIN_CHARSET, t => t == 'ci' || t == 'lé')
    ).toEqual(['ceci', 'est', 'très', 'vanillé'])

    const notInVocab = t => !{ ce: 1, ci: 1, est: 1 }[t]
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
