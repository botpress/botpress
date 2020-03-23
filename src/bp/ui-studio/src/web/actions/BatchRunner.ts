import Promise from 'bluebird'

// `execute` must be a function accepting an array of resource IDs
// and returning a promise resolving to an object mapping
// from ID to the data object
const BatchRunner = (execute, { maxQueue = 100, maxInterval = 20 } = {}) => {
  let queue = []
  const promises = {}

  const run = () => {
    if (!queue.length) {
      return
    }
    const ids = queue
    queue = []

    execute(ids)
      .then(resources => {
        for (const id of ids) {
          promises[id].resolve(resources[id])
          delete promises[id]
        }
      })
      .catch(err => {
        for (const id of ids) {
          promises[id].reject(err)
          delete promises[id]
        }
      })
  }

  const add = resourceId => {
    // don't fetch the same resource twice
    if (promises[resourceId]) {
      return promises[resourceId].promise
    }

    queue.push(resourceId)
    const p = new Promise((resolve, reject) => {
      promises[resourceId] = { resolve, reject }
    })
    promises[resourceId].promise = p

    // drain the queue when the max length is reached
    if (queue.length >= maxQueue) {
      run()
    }

    return p
  }

  // drain the queue on a regular basis
  const intervalId = setInterval(run, maxInterval)

  const destroy = () => {
    clearInterval(intervalId)
  }

  return { add, destroy }
}

export default BatchRunner
