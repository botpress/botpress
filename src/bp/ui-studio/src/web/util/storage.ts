import Cookie from 'js-cookie'

export interface BPStorage {
  set: (key: string, value: string) => void
  get: (key: string) => string
  del: (key: string) => void
}

const getDriver = () =>
  window.USE_SESSION_STORAGE === true && typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage

const storage: BPStorage = {
  set: (key: string, value: string) => {
    try {
      const driver = getDriver()
      driver ? driver.setItem(key, value) : Cookie.set(key, value)
    } catch (err) {
      console.log('Error while getting data from storage.', err.message)
    }
  },
  get: (key: string) => {
    try {
      const driver = getDriver()
      return driver ? driver.getItem(key) : Cookie.get(key)
    } catch (err) {
      console.log('Error while getting data from storage.', err.message)
    }
  },
  del: (key: string) => {
    try {
      const driver = getDriver()
      driver ? driver.removeItem(key) : Cookie.remove(key)
    } catch (err) {
      console.log('Error while deleting data from storage.', err.message)
    }
  }
}

/**
 * Exposing this logic so modules & others can access it.
 * Sometimes the browser denies access to local storage (or simply doesn't support it), so we offer a fallback
 */
window.BP_STORAGE = storage

export default storage
