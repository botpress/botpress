import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { IntentDefinitionWithTokens, LanguageProvider, Model, TrainingPoint, TrainingSet } from '../../typings'
import { createPointsFromUtteranceTokens } from '../language/ft_featurizer'

import { generateNoneIntent } from './none_intent_utils'

export const getContextsFromIntentDefs = (defs: sdk.NLU.IntentDefinition[]): string[] =>
  _.chain(defs)
    .flatMap(x => x.contexts)
    .uniq()
    .value()

export const getPointsForContext = async (
  intentsWTokens: IntentDefinitionWithTokens[],
  context: string,
  lang: string,
  langProvider: LanguageProvider,
  tfIdf,
  token2vec
): Promise<TrainingPoint[]> => {
  const noneIntent = await generateNoneIntent(intentsWTokens, lang, context, langProvider)
  const intentsWithNone = intentsWTokens.concat(noneIntent)

  const nestedPoints = await Promise.map(intentsWithNone, async intent =>
    Promise.map(
      intent.tokens,
      createPointsFromUtteranceTokens(intent.name, lang, langProvider, token2vec, context, tfIdf)
    )
  )

  return _.chain(nestedPoints)
    .reject(_.isEmpty)
    .flatten()
    .value()
}

export const createl1ModelsFromAllPoints = async (
  allPoints: TrainingSet[],
  modelHash: string,
  toolkit: typeof sdk.MLToolkit,
  notify,
  progressFn
): Promise<Model[]> =>
  Promise.map(allPoints, async (ctxPoints, index) => {
    const points = ctxPoints.points.map(point => point.l1Point)
    const svm = new toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
    await svm.train(points, notify(progressFn(index)))
    const modelStr = svm.serialize()

    return {
      meta: {
        context: ctxPoints.context,
        created_on: Date.now(),
        hash: modelHash,
        scope: 'bot',
        type: 'intent-l1'
      },
      model: new Buffer(modelStr, 'utf8')
    }
  })

export const createl0ModelFromAllPoints = async (
  allPoints: TrainingSet[],
  modelHash: string,
  toolkit: typeof sdk.MLToolkit,
  notify,
  progressFn
): Promise<Model> => {
  const l0Points = _.chain(allPoints)
    .flatMap(ctxPoints => ctxPoints.points.map(point => point.l0Point))
    .reject(_.isEmpty)
    .value()

  const svm = new toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
  await svm.train(l0Points, notify(progressFn(0)))
  const modelStr = svm.serialize()

  return {
    meta: {
      context: 'all',
      created_on: Date.now(),
      hash: modelHash,
      scope: 'bot',
      type: 'intent-l0'
    },
    model: new Buffer(modelStr, 'utf8')
  }
}
