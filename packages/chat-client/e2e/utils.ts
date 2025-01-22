import * as jwt from 'jsonwebtoken'
import * as uuid from 'uuid'
import * as chat from '../src'
import * as config from './config'

const encryptionKey = config.get('ENCRYPTION_KEY')

export const halfId = () => {
  const id = uuid.v4()
  return id.slice(0, id.length / 2)
}
export const getUserFid = (): string => `test-user-${halfId()}`
export const getConversationFid = (): string => `test-conversation-${halfId()}`
export const getUserKey = (userId: string): string => jwt.sign({ id: userId }, encryptionKey, { algorithm: 'HS256' })

export const waitFor = <S extends keyof chat.Signals>(
  listener: chat.SignalListener,
  signal: S
): Promise<chat.Signals[S]> =>
  new Promise((resolve, reject) => {
    listener.once(signal, resolve)
    listener.once('error', reject)
  })
