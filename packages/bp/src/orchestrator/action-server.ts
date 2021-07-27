import cluster from 'cluster'
import { MessageType, registerMsgHandler, WorkerType } from './master'

interface StartLocalActionServerMessage {
  appSecret: string
  port: number
}

export const registerActionServerMainHandler = () => {
  registerMsgHandler(MessageType.StartActionServer, (message: StartLocalActionServerMessage) => {
    const { appSecret, port } = message
    cluster.fork({ WORKER_TYPE: WorkerType.LOCAL_ACTION_SERVER, APP_SECRET: appSecret, PORT: port })
  })
}

export const startLocalActionServer = (message: StartLocalActionServerMessage) => {
  process.send!({ type: MessageType.StartActionServer, ...message })
}
