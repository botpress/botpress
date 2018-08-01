import nanoid from 'nanoid'

let processInfo = {}

const processIndicator = ({ events }) => {
  const create = ({ title = 'Process' }) => {
    const id = nanoid()
    const status = 'In Progress'

    processInfo = { title, id, status }

    events.emit('process-indicator.create', processInfo)
  }

  const complete = status => {
    events.emit('process-indicator.complete', Object.assign({}, processInfo, status))

    processInfo = {}
  }

  events.on('process-indicator.fetch', () => {
    events.emit('process-indicator.update', processInfo)
  })

  return {
    create,
    complete
  }
}

module.exports = processIndicator
