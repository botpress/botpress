import { NLU } from 'botpress/sdk'
import { ErrorMessage } from 'ml/error-utils'

import { TrainInput, TrainOutput } from '../training-pipeline'

export type OutgoingPayload<T extends OutgoingMessageType> = T extends 'make_new_worker'
  ? { config: NLU.LanguageConfig; requestId: string }
  : T extends 'start_training'
  ? { input: TrainInput }
  : {}

export type OutgoingMessageType = 'make_new_worker' | 'start_training' | 'cancel_training'
export interface OutgoingMessage<T extends OutgoingMessageType> {
  type: T
  payload: OutgoingPayload<T>
  destWorkerId: number
}

export type Log = Partial<{ info: string; warning: string; error: string }>
export type IncomingPayload<T extends IncomingMessageType> = T extends 'log'
  ? { log: Log; requestId: string }
  : T extends 'worker_ready'
  ? { requestId: string }
  : T extends 'training_canceled'
  ? {}
  : T extends 'training_done'
  ? { output: TrainOutput | undefined }
  : T extends 'training_progress'
  ? { progress: number }
  : T extends 'training_error'
  ? { error: ErrorMessage }
  : {}

export type IncomingMessageType =
  | 'log'
  | 'worker_ready'
  | 'training_canceled'
  | 'training_done'
  | 'training_progress'
  | 'training_error'

export interface IncomingMessage<T extends IncomingMessageType> {
  type: T
  payload: IncomingPayload<T>
  srcWorkerId: number
}

export type AllOutgoingMessages = OutgoingMessage<OutgoingMessageType>
export type AllIncomingMessages = IncomingMessage<IncomingMessageType>

export const isMakeNewWorker = (msg: AllOutgoingMessages): msg is OutgoingMessage<'make_new_worker'> =>
  msg.type === 'make_new_worker'
export const isStartTraining = (msg: AllOutgoingMessages): msg is OutgoingMessage<'start_training'> =>
  msg.type === 'start_training'
export const isCancelTraining = (msg: AllOutgoingMessages): msg is OutgoingMessage<'cancel_training'> =>
  msg.type === 'cancel_training'

export const isLog = (msg: AllIncomingMessages): msg is IncomingMessage<'log'> => msg.type === 'log'
export const isWorkerReady = (msg: AllIncomingMessages): msg is IncomingMessage<'worker_ready'> =>
  msg.type === 'worker_ready'
export const isTrainingCanceled = (msg: AllIncomingMessages): msg is IncomingMessage<'training_canceled'> =>
  msg.type === 'training_canceled'
export const isTrainingDone = (msg: AllIncomingMessages): msg is IncomingMessage<'training_done'> =>
  msg.type === 'training_done'
export const isTrainingProgress = (msg: AllIncomingMessages): msg is IncomingMessage<'training_progress'> =>
  msg.type === 'training_progress'
export const isTrainingError = (msg: AllIncomingMessages): msg is IncomingMessage<'training_error'> =>
  msg.type === 'training_error'
