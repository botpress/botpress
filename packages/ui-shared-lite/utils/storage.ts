import Cookie from 'js-cookie'

export interface BPStorage {
  set: <T>(key: string, value: T) => void
  get: <T = string>(key: string) => T | undefined
  del: (key: string) => void
}

let useSessionStorage = new Boolean(window.USE_SESSION_STORAGE)
let storageDriver: 'cookie' | Storage
const getDriver = (): 'cookie' | Storage => {
  if (storageDriver && window.USE_SESSION_STORAGE === useSessionStorage) {
    return storageDriver
  }

  try {
    useSessionStorage = new Boolean(window.USE_SESSION_STORAGE)

    const storage =
      window.USE_SESSION_STORAGE === true && typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage

    const tempKey = '__storage_test__'
    storage.setItem(tempKey, tempKey)
    storage.removeItem(tempKey)

    return (storageDriver = storage)
  } catch (e) {
    return (storageDriver = 'cookie')
  }
}

const serialize = <T>(value: T): string => {
  if (value === null || value === undefined) {
    throw new Error('[Storage] Cannot store null or undefined values')
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value)
  } catch {
    console.error('[Storage] Error parsing value', value)
    return ''
  }
}

const deserialize = <T>(strValue: string | null | undefined): T | undefined => {
  if (strValue === null || strValue === undefined) {
    return undefined
  }

  try {
    return JSON.parse(strValue)
  } catch {
    return strValue as any
  }
}

const storage: BPStorage = {
  set: <T>(key: string, value: T) => {
    try {
      const driver = getDriver()
      driver !== 'cookie' ? driver.setItem(key, serialize(value)) : Cookie.set(key, serialize(value))
    } catch (err) {
      console.error('Error while setting data into storage.', err.message)
    }
  },
  get: <T = string>(key: string): T | undefined => {
    try {
      const driver = getDriver()
      return driver !== 'cookie' ? deserialize(driver.getItem(key)) : deserialize(Cookie.get(key))
    } catch (err) {
      console.error('Error while getting data from storage.', err.message)
    }
  },
  del: (key: string) => {
    try {
      const driver = getDriver()
      driver !== 'cookie' ? driver.removeItem(key) : Cookie.remove(key)
    } catch (err) {
      console.error('Error while deleting data from storage.', err.message)
    }
  }
}

/**
 * Exposing this logic so modules & others can access it.
 * Sometimes the browser denies access to local storage (or simply doesn't support it), so we offer a fallback
 */
window.BP_STORAGE = storage

export default storage
