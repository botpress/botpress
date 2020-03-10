import * as sdk from 'botpress/sdk'

import { isSpace, tokenizeLatinTextForTests } from '../tools/token-utils'

import { fallbackTagger, getPOSTagger, tagSentence } from './pos-tagger'

describe('POS Tagger', () => {
  test('Fallback tagger returns NA tags properly', () => {
    const feats = [['feat1=1', 'feat2'], ['feat1=2'], ['feat1=3', 'feat2']]
    const { probability, result: tags } = fallbackTagger.tag(feats)
    expect(probability).toEqual(1)
    expect(tags.every(t => t === 'N/A')).toBeTruthy()

    fallbackTagger.marginal(feats).forEach(res => {
      expect(res).toEqual({ 'N/A': 1 })
    })
  })

  test('Get tagger returns FB tagger for other languages than english', () => {
    const tagger = getPOSTagger('de', {} as typeof sdk.MLToolkit)
    expect(tagger).toEqual(fallbackTagger)
  })

  describe('tagSentence', () => {
    const mockedTagger = {
      ...fallbackTagger,
      tag: jest.fn(xseq => fallbackTagger.tag(xseq))
    }

    test('Calls tagger without spaces and adds _ for space tokens', () => {
      const xseq = tokenizeLatinTextForTests(
        'A Sea Fox is a Fox-alien-fish crossbreed with a strange amalgamation of a bunch of different animals and plants'
      )
      const n_space = xseq.filter(t => isSpace(t)).length

      const tags = tagSentence(mockedTagger as sdk.MLToolkit.CRF.Tagger, xseq)
      expect(mockedTagger.tag.mock.calls[0][0].length).toEqual(xseq.length - n_space)
      expect(tags.filter(t => isSpace(t)).length).toEqual(n_space)
      tags
        .filter(t => !isSpace(t))
        .forEach(t => {
          expect(t).toEqual('N/A') // return value of the mocked tagger
        })
    })
  })
})
