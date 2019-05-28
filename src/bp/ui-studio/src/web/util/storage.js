import Cookie from 'js-cookie'

const storage = {
  set: (key, value) => {
    try {
      localStorage ? localStorage.setItem(key, value) : Cookie.set(key, value)
    } catch (err) {
      console.log('Error while getting data from storage.', err.message)
    }
  },
  get: key => {
    try {
      return localStorage ? localStorage.getItem(key) : Cookie.get(key)
    } catch (err) {
      console.log('Error while getting data from storage.', err.message)
    }
  },
  del: key => {
    try {
      localStorage ? localStorage.removeItem(key) : Cookie.remove(key)
    } catch (err) {
      console.log('Error while deleting data from storage.', err.message)
    }
  }
}

export default storage
