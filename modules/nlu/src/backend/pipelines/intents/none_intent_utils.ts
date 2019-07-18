import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { LanguageProvider } from '../../typings'

const nbOfNoneUtterances = (averageWordCount: number): number => Math.round(Math.max(5, averageWordCount / 2)) // minimum 5 none utterances per context, max 50% of the average utterances set

const genNbWords = (averageWordCount: number): number =>
  Math.round(_.random(averageWordCount / 2, averageWordCount * 2))

const sampleFrom = (pool: string[], length: number, nbWords: number): string[][] =>
  Array.from({ length }, () => _.sampleSize(pool, nbWords))

const generateNoneUtterances = async (
  intentsWTokens,
  lang: string,
  langProvider: LanguageProvider
): Promise<string[][]> => {
  const utterances = _.chain(intentsWTokens)
    .flatMap(x => x.tokens)
    .value() as string[][]

  const averageWordCount = _.meanBy(utterances, x => x.length)
  const vocabulary = _.flatten(utterances) as string[]

  // Vectorize all the vocabulary upfront to batch and cache it
  await langProvider.vectorize(vocabulary, lang)
  const junkWords = await langProvider.generateSimilarJunkWords(vocabulary, lang)

  const length = nbOfNoneUtterances(averageWordCount)
  const nbWords = genNbWords(averageWordCount)

  return sampleFrom(junkWords, length, nbWords)
}

export const generateNoneIntent = async (
  intentsWTokens,
  lang,
  context,
  langProvider
): Promise<sdk.NLU.IntentDefinitionWithTokens> => {
  const noneUtterances = await generateNoneUtterances(intentsWTokens, lang, langProvider)

  return {
    contexts: [context],
    filename: 'none.json',
    name: 'none',
    slots: [],
    tokens: noneUtterances,
    utterances: { [lang]: noneUtterances.map(utt => utt.join(' ')) }
  }
}
