// tslint:disable-next-line:ordered-imports
import '../sdk/worker-before'
// tslint:disable-next-line:ordered-imports
import '../sdk/rewire'

// tslint:disable-next-line:ordered-imports
import * as sdk from 'botpress/sdk'
import { parentPort } from 'worker_threads'

import { Trainer as CrfTrainer } from './crf'
import { serializeError } from './error-utils'
import { Message } from './ml-thread-pool'
import { Trainer as SvmTrainer } from './svm'

// Debugging currently not possible in this file and beyond...

async function messageHandler(msg: Message) {
  if (msg.type === 'svm_train') {
    let svmProgressCalls = 0

    const progressCb = (progress: number) => {
      if (++svmProgressCalls % 10 === 0 || progress === 1) {
        const response: Message = { type: 'svm_progress', id: msg.id, payload: { progress } }
        parentPort?.postMessage(response)
      }
    }
    try {
      const { points, options } = msg.payload

      const trainer = new SvmTrainer()
      const result = await trainer.train(
        points as sdk.MLToolkit.SVM.DataPoint[],
        options as sdk.MLToolkit.SVM.SVMOptions,
        progressCb
      )
      const response: Message = { type: 'svm_done', id: msg.id, payload: { result } }
      parentPort?.postMessage(response)
    } catch (err) {
      const response: Message = { type: 'svm_error', id: msg.id, payload: { error: serializeError(err) } }
      parentPort?.postMessage(response)
    }
  }

  if (msg.type === 'crf_train') {
    const { points, options } = msg.payload

    const progressCb = (iteration: number) => {
      const progressMsg: Message = { type: 'crf_progress', id: msg.id, payload: { progress: iteration } }
      parentPort?.postMessage(progressMsg)
    }

    try {
      const trainer = new CrfTrainer()
      const result = await trainer.train(
        points as sdk.MLToolkit.CRF.DataPoint[],
        options as sdk.MLToolkit.CRF.TrainerOptions,
        progressCb
      )
      const response: Message = { type: 'crf_done', id: msg.id, payload: { result } }
      parentPort?.postMessage(response)
    } catch (err) {
      const response: Message = { type: 'crf_error', id: msg.id, payload: { error: serializeError(err) } }
      parentPort?.postMessage(response)
    }
  }
}
parentPort?.on('message', messageHandler)
