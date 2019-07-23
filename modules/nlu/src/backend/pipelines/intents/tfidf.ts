import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Model, Token2Vec, IntentDefinitionWithTokens, L1Models, LanguageProvider } from '../../typings'
import { enrichToken2Vec } from '../language/ft_featurizer'

const MAX_TFIDF = 2
const MIN_TFIDF = 0.5

export type TfidfInput = _.Dictionary<string[]>
export type TfidfOutput = _.Dictionary<_.Dictionary<number>>

export const parsel0 = (toolkit, model) => new toolkit.SVM.Predictor(model.model.toString('utf8'))

export const parsel1 = (toolkit, models: Model[]): L1Models => {
  if (_.uniqBy(models, x => x.meta.context).length !== models.length) {
    const ctx = models.map(x => x.meta.context).join(', ')
    throw new Error(`You can't train different models with the same context. Ctx = [${ctx}]`)
  }

  return models.reduce(
    (acc, model) => ({
      ...acc,
      ...{ [model.meta.context]: new toolkit.SVM.Predictor(model.model.toString('utf8')) }
    }),
    {}
  )
}

export const parseTfIdf = model => JSON.parse(model.model.toString('utf8'))

export function tfidf(docs: TfidfInput): TfidfOutput {
  const result: TfidfOutput = {}

  const _avgSum: _.Dictionary<number> = {}
  const _avgCount: _.Dictionary<number> = {}

  for (const docName in docs) {
    const tokens = docs[docName]

    const termsCount = _.countBy(tokens, _.identity)
    const meanTf = _.mean(_.values(termsCount))!

    const tfidf: _.Dictionary<number> = _.mapValues(termsCount, (_v, key) => {
      const docFreq = _.values(docs).filter(x => x.includes(key)).length

      // Double-normalization TF with K=0.5
      // See https://en.wikipedia.org/wiki/Tf%E2%80%93idf
      const tf = 0.5 + (0.5 * termsCount[key]) / meanTf

      // Smooth IDF
      const idf = Math.max(0.25, -Math.log(docFreq / Object.keys(docs).length))
      const tfidf = Math.max(MIN_TFIDF, Math.min(MAX_TFIDF, tf * idf))
      _avgSum[key] = (_avgSum[key] || 0) + tfidf
      _avgCount[key] = (_avgCount[key] || 0) + 1
      return tfidf
    })

    tfidf['__avg__'] = _.mean(_.values(tfidf))
    result[docName] = tfidf
  }

  result['__avg__'] = _.mapValues(_avgSum, (v, key) => v / _avgCount[key])

  return result
}

export const computeToken2Vec = async (
  token2vec: Token2Vec,
  intentsWithNone: IntentDefinitionWithTokens[],
  lang: string,
  langProvider: LanguageProvider
): Promise<void> => {
  await Promise.map(
    intentsWithNone,
    async intent =>
      await Promise.all(
        intent.tokens.map(async utteranceTokens => {
          if (intent.name !== 'none') {
            await enrichToken2Vec(lang, utteranceTokens, langProvider, token2vec)
          }
        })
      )
  )
}

export const computeTfidf = (intentsWTokens): { [context: string]: TfidfOutput } => {
  const allContexts = _.chain(intentsWTokens)
    .flatMap(x => x.contexts)
    .uniq()
    .value()

  const l0TfidfInput: TfidfInput = {}

  const l1Tfidf: {
    [context: string]: TfidfOutput
  } = {}

  for (const context of allContexts) {
    const intents = intentsWTokens.filter(x => x.contexts.includes(context))
    l0TfidfInput[context] = _.flatten(_.flatten(intents.map(x => x.tokens)))
    const l1Input: TfidfInput = {}

    for (const { name, tokens } of intents) {
      l1Input[name] = _.flatten(tokens)
    }

    l1Tfidf[context] = tfidf(l1Input)
  }

  l1Tfidf['l0'] = tfidf(l0TfidfInput)
  return l1Tfidf
}
