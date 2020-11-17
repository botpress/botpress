import serialize from 'serialize-javascript'

const deserialize = (serializedJavascript: string) => {
  return eval('(' + serializedJavascript + ')')
}

const key = (path: string) => ['bp', 'hitlnext', path].join('::')

const get = (path: string, defaultValue = undefined) => {
  const data = window.BP_STORAGE.get(key(path))
  return data ? deserialize(data) : defaultValue
}

const set = (path: string, data) => {
  window.BP_STORAGE.set(key(path), serialize(data))
}

export default { get, set }
