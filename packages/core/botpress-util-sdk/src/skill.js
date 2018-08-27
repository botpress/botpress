import _ from 'lodash'

const genId = () =>
  Math.random()
    .toString()
    .substr(2, 6)

const _renderElement = (type, args) => {
  if (_.isString(args)) {
    return `say ${type} ${args}`
  } else {
    return `say ${type} ${JSON.stringify(args)}`
  }
}

export function Flow(config) {
  const obj = { ...config }

  if (!obj.version) {
    obj.version = '0.0'
  }

  if (!obj.name || !obj.location) {
    obj.name = obj.location = genId()
  }

  if (!obj.startNode) {
    if (!obj.nodes || obj.nodes.length <= 0) {
      throw new Error('Expected at least one node in `nodes`')
    }

    if (!obj.nodes.filter(n => n.name === 'entry').length) {
      obj.startNode = obj.nodes[0].name
    }

    obj.startNode = 'entry'
  }

  return obj
}

export function Node(config) {
  const obj = { ...config }

  if (!obj.id) {
    obj.id = genId()
  }

  if (!obj.onEnter) {
    obj.onEnter = []
  }

  if (!obj.onReceive) {
    obj.onReceive = null
  }

  if (!obj.next) {
    obj.next = []
  }

  return obj
}

export function renderElement(...args) {
  if (args.length === 1) {
    return _renderElement('#builtin_text', args[0])
  } else if (args.length === 2) {
    return _renderElement(args[0], args[1])
  } else {
    throw new Error('Can only call say with one or two args')
  }
}

export function runAction(name, args) {
  return args ? `${name} ${JSON.stringify(args)}` : name
}
