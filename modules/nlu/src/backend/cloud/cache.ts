import ms from 'ms'
import { Locker } from './lock'

export interface Options<T> {
  getToken?: (res: T) => string
  getExpiryInMs?: (res: T) => number
}

const defaultExpiry = ms('10m') // 10 minutes in ms
const isTokenActive = (token: string | null, expiration: number | null) =>
  token && expiration && expiration > Date.now()

export const cache = <T>(authenticate: () => Promise<T>, options?: Options<T>) => {
  const getToken: (res: any) => string = options?.getToken ?? (res => res)
  const getExpiry: (res: any) => number = options?.getExpiryInMs ?? (() => defaultExpiry)

  const lock = Locker()

  let token: string | null = null
  let expiration: number | null = null

  const tokenCache = async () => {
    if (isTokenActive(token, expiration)) {
      return token!
    }

    const unlock = await lock('cache')

    try {
      if (isTokenActive(token, expiration)) {
        return token!
      }

      const res = await authenticate()

      token = getToken(res)
      expiration = Date.now() + getExpiry(res)
      return token
    } catch (e) {
      throw e
    } finally {
      unlock()
    }
  }

  tokenCache.reset = () => {
    token = null
    expiration = null
  }

  return tokenCache
}
