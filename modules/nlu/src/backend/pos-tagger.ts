import * as sdk from 'botpress/sdk'
import path from 'path'
import yn from 'yn'

import { isSpace, SPACE } from './tools/token-utils'

const USE_POS = yn(process.env.BP_EXPERIMENTAL_NLU_POS)

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

type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<infer ElementType> ? ElementType : never

export type POS_CLASS = ElementType<typeof POS_CLASSES>
export const POS1_SET: POS_CLASS[] = ['VERB', 'NOUN']
export const POS2_SET: POS_CLASS[] = ['ADJ', 'ADV', 'ADV', 'AUX', 'DET', 'PROPN', 'PRON']
export const POS3_SET: POS_CLASS[] = ['CONJ', 'CCONJ', 'INTJ', 'AUX', 'SCONJ']
export const POS4_SET: POS_CLASS[] = ['PUNCT', 'SYM', 'X', 'NUM', 'PART']

// export function makePOSdic(): _.Dictionary<ReadonlyArray<number>[]> {
export function makePOSdic(): _.Dictionary<number> {
  return POS_CLASSES.reduce((dic, cls) => ({ ...dic, [cls]: 0 }), {})
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
  // TODO check that language is part of supported languages once we support more
  if (!USE_POS || languageCode !== 'en') {
    return fallbackTagger
  }

  if (!taggersByLang[languageCode]) {
    const tagger = toolkit.CRF.createTagger()
    const filepath = path.join(__dirname, `tools/pretrained/pos.${languageCode}.model`)
    tagger.open(filepath)
    taggersByLang[languageCode] = tagger
  }

  return taggersByLang[languageCode]
}

export function tagSentence(tagger: sdk.MLToolkit.CRF.Tagger, tokens: string[]): string[] {
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

  return tags
}
