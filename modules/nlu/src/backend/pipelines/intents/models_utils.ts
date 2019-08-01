import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Model, TrainingSet } from '../../typings'

export const createl1Models = async (
  allPoints: TrainingSet[],
  modelHash: string,
  toolkit: typeof sdk.MLToolkit,
  notify,
  progressFn
): Promise<Model[]> =>
  Promise.map(allPoints, async (ctxPoints, index) => {
    const points = ctxPoints.points.map(point => _.pick(point, ['coordinates', 'label']))
    const svm = new toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
    await svm.train(points, notify(progressFn(index)))
    const modelStr = svm.serialize()

    return {
      meta: {
        context: ctxPoints.context,
        created_on: Date.now(),
        hash: modelHash,
        scope: 'bot',
        type: 'l1'
      },
      model: new Buffer(modelStr, 'utf8')
    }
  })

export const createl0Model = async (
  allPoints: TrainingSet[],
  modelHash: string,
  toolkit: typeof sdk.MLToolkit,
  notify,
  progressFn
): Promise<Model> => {
  const l0Points = allPoints.map(ctxPoints => ctxPoints.points.map(point => _.pick(point, ['coordinates', 'label'])))
  const svm = new toolkit.SVM.Trainer({ kernel: 'LINEAR', classifier: 'C_SVC' })
  await svm.train(_.flatten(l0Points), notify(progressFn(0)))
  const modelStr = svm.serialize()

  return {
    meta: {
      context: 'all',
      created_on: Date.now(),
      hash: modelHash,
      scope: 'bot',
      type: 'l0'
    },
    model: new Buffer(modelStr, 'utf8')
  }
}
