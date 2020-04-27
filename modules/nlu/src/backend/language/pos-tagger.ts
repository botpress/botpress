import * as sdk from 'botpress/sdk'
import path from 'path'

import { isSpace, SPACE } from '../tools/token-utils'

type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never
export type POSClass = ElementType<typeof POS_CLASSES>

export const POS_CLASSES = [
  'ADJ',
  'ADP',
  'ADV',
  'AUX',
  'CONJ',
  'CCONJ',
  'DET',
  'INTJ',
  'NOUN',
  'NUM',
  'PART',
  'PRON',
  'PROPN',
  'PUNCT',
  'SCONJ',
  'SYM',
  'VERB',
  'X',
  SPACE
] as const

export function isPOSAvailable(lang: string): boolean {
  // TODO check that language is part of supported languages once we support more
  return lang === 'en' || lang == 'fr'
}

function getPretrainedModelFilePath(languageCode: string): string {
  return path.join(__dirname, `./pre-trained/pos.${languageCode}.model`)
}

function n_alpha(word: string): number {
  // TODO support more alphabets
  return (word.match(/[a-zA-z]/g) || []).length
}

function n_digits(word: string): number {
  return (word.match(/\d/g) || []).length
}

function pref(word: string, nchars: number): string {
  return word.length > nchars ? word.slice(0, nchars) : ''
}

function suff(word: string, nchars: number): string {
  return word.length > nchars ? word.slice(-nchars) : ''
}

function wordFeatures(seq: string[], idx: number): string[] {
  const word = seq[idx].toLowerCase()
  const a = n_alpha(word)
  const d = n_digits(word)
  const bos = idx === 0
  const eos = idx == seq.length - 1
  const feats = {
    BOS: bos,
    EOS: eos,
    prefix_1: pref(word, 1),
    prefix_2: pref(word, 2),
    prefix_3: pref(word, 3),
    prefix_4: pref(word, 4),
    suffix_1: suff(word, 1),
    suffix_2: suff(word, 2),
    suffix_3: suff(word, 3),
    suffix_4: suff(word, 4),
    len: word.length,
    alpha: a,
    contains_num: d > 0,
    contains_special: word.length - a - d > 0,
    word: word,
    prev_word: bos ? '' : seq[idx - 1].toLowerCase(),
    next_word: eos ? '' : seq[idx + 1].toLowerCase()
  }

  return Object.entries(feats)
    .filter(([key, val]) => val)
    .map(([key, val]) => {
      const v = typeof val === 'boolean' ? '' : `=${val}`
      return `${key}${v}`
    })
}

export const fallbackTagger: sdk.MLToolkit.CRF.Tagger = {
  tag: seq => ({ probability: 1, result: new Array(seq.length).fill('N/A') }),
  open: f => false,
  marginal: seq => new Array(seq.length).fill({ 'N/A': 1 })
}

// eventually this will be moved in language provider
// POS tagging will reside language server once we support more than english
const taggersByLang: { [lang: string]: sdk.MLToolkit.CRF.Tagger } = {}

export function getPOSTagger(languageCode: string, toolkit: typeof sdk.MLToolkit): sdk.MLToolkit.CRF.Tagger {
  if (!isPOSAvailable(languageCode)) {
    return fallbackTagger
  }

  if (!taggersByLang[languageCode]) {
    const tagger = toolkit.CRF.createTagger()
    tagger.open(getPretrainedModelFilePath(languageCode))
    taggersByLang[languageCode] = tagger
  }

  return taggersByLang[languageCode]
}

export function tagSentence(tagger: sdk.MLToolkit.CRF.Tagger, tokens: string[]): POSClass[] {
  const [words, spaceIdx] = tokens.reduce(
    ([words, spaceIdx], token, idx) => {
      if (isSpace(token)) {
        return [words, [...spaceIdx, idx]]
      } else {
        return [[...words, token], spaceIdx]
      }
    },
    [[], []]
  ) as [string[], number[]]

  const feats: string[][] = []
  for (let i = 0; i < words.length; i++) {
    feats.push(wordFeatures(words, i))
  }

  const tags = tagger.tag(feats).result
  for (const idx of spaceIdx) {
    tags.splice(idx, 0, SPACE)
  }

  return tags as POSClass[]
}
