import { ChatApi } from '../api'

export type Operation = Parameters<ChatApi['addOperation']>[0]
export type OperationFunc = (api: ChatApi) => Operation
