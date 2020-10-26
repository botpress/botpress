import _ from 'lodash'
import Haikunator from 'haikunator'

function generateUsername() {
  const haiku = new Haikunator({ defaults: { tokenLength: 0 } })
  return haiku.haikunate({ delimiter: ' ' })
}

function getOrSet(get: Function, set: (value: any) => void, value) {
  const got = get()
  if (got != null) return got
  set(value)
  return value
}

export { generateUsername, getOrSet }
