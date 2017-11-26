import Promise from 'bluebird'
import services from '+/services'

const _services = {}
let resolveInit = false

let initPromise = new Promise(resolve => {
  resolveInit = resolve
})

async function init(obj) {
  if (!initPromise.isFulfilled()) {
    resolveInit()
    Object.assign(_services, await services(obj))
  }
}

function registerService(name, fn) {
  if (!!_services[name]) {
    throw new Error(`Service '${name}' has already been set`)
  }

  _services[name] = fn
}

async function getService(name, throwIfNotFound = true) {
  await initPromise.timeout(5000).catch(err => {
    throw new Error('ServiceLocator was not initialized')
  })

  if (throwIfNotFound && !_services[name]) {
    throw new Error(`Service '${name}' not registered`)
  }

  return _services[name]
}

module.exports = { init, registerService, getService }
