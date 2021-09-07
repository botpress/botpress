import serialize from 'serialize-javascript'

import { MODULE_NAME } from '../../../constants'

const deserialize = (serializedJavascript: string) => {
  return eval('(' + serializedJavascript + ')')
}

const key = (path: string) => ['bp', MODULE_NAME, path].join('::')

const get = (path: string, defaultValue = undefined) => {
  const data = window.BP_STORAGE.get(key(path))
  return data ? deserialize(data) : defaultValue
}

const set = (path: string, data: any) => {
  window.BP_STORAGE.set(key(path), serialize(data))
}

export default { get, set }
