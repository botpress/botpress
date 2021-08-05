import { Lock } from 'lock'

export interface Options<T> {
  getToken?: (res: T) => string
  getExpiry?: (res: T) => number
}

const defaultExpiry = 60000 // 10 minutes in ms

export const cache = <T>(authenticate: () => Promise<T>, options?: Options<T>) => {
  const getToken: (res: any) => string = options?.getToken ?? (res => res)
  const getExpiry: (res: any) => number = options?.getExpiry ?? (() => defaultExpiry)

  const lock = Lock()

  let token: string | null = null
  let expiration: number | null = null

  const tokenCache = async () => {
    if (token && expiration && expiration - Date.now() > 0) {
      return token
    }

    return new Promise<string>((resolve, reject) => {
      lock('cache', unlockFn => {
        const unlock = unlockFn()

        if (token && expiration && expiration - Date.now() > 0) {
          unlock()
          resolve(token)
          return
        }

        authenticate()
          .then(authenticateRes => {
            token = getToken(authenticateRes)
            expiration = Date.now() + getExpiry(authenticateRes)
            unlock()
            resolve(token)
          })
          .catch(e => {
            unlock()
            reject(e)
          })
      })
    })
  }

  tokenCache.reset = () => {
    token = null
    expiration = null
  }

  return tokenCache
}
