import serialize from 'serialize-javascript'

import { MODULE_NAME } from '../../../constants'

const key = (path: string) => ['bp', MODULE_NAME, path].join('::')

const get = (path: string, defaultValue = undefined) => {
  return window.BP_STORAGE.get(key(path)) || defaultValue
}

const set = (path: string, data: any) => {
  window.BP_STORAGE.set(key(path), serialize(data))
}

export default { get, set }
