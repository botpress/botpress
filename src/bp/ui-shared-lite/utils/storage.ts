import Cookie from 'js-cookie'

export interface BPStorage {
  set: (key: string, value: string) => void
  get: (key: string) => string | undefined
  del: (key: string) => void
}

let useSessionState = new Boolean(window.USE_SESSION_STORAGE)
let storageDriver: 'cookie' | Storage
const getDriver = (): 'cookie' | Storage => {
  if (storageDriver && window.USE_SESSION_STORAGE === useSessionState) {
    return storageDriver
  }

  try {
    useSessionState = new Boolean(window.USE_SESSION_STORAGE)

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

const storage: BPStorage = {
  set: (key: string, value: string) => {
    try {
      const driver = getDriver()
      driver !== 'cookie' ? driver.setItem(key, value) : Cookie.set(key, value)
    } catch (err) {
      console.error('Error while saving data into storage.', err.message)
    }
  },
  get: (key: string) => {
    try {
      const driver = getDriver()
      return driver !== 'cookie' ? driver.getItem(key) || undefined : Cookie.get(key)
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
