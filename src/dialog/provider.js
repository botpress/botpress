import path from 'path'
import fs from 'fs'
import glob from 'glob'
import _ from 'lodash'
import Promise from 'bluebird'
import EventEmitter2 from 'eventemitter2'
import mkdirp from 'mkdirp'

export default class FlowProvider extends EventEmitter2 {
  constructor({ logger, botfile, projectLocation }) {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.logger = logger
    this.botfile = botfile
    this.projectLocation = projectLocation
  }

  async loadAll() {
    const relDir = this.botfile.flowsDir || './flows'
    const flowsDir = path.resolve(this.projectLocation, relDir)

    if (!fs.existsSync(flowsDir)) {
      return []
    }

    const searchOptions = { cwd: flowsDir }

    const flowFiles = await Promise.fromCallback(callback => glob('**/*.flow.json', searchOptions, callback))

    const flows = []

    flowFiles.forEach(file => {
      const filePath = path.resolve(flowsDir, './' + file)
      const flow = JSON.parse(fs.readFileSync(filePath))

      flow.name = file // e.g. 'login.flow.json' or 'shapes/circle.flow.json'

      const schemaError = this._validateSchema(flow)
      if (schemaError) {
        return this.logger.warn(schemaError)
      }

      const uiEqPath = path.resolve(flowsDir, './' + file.replace(/\.flow/g, '.ui'))
      let uiEq = {}

      if (fs.existsSync(uiEqPath)) {
        uiEq = JSON.parse(fs.readFileSync(uiEqPath))
      }

      Object.assign(flow, { links: uiEq.links })

      // Take position from UI files or create default position
      const unplacedNodes = []
      flow.nodes.forEach(node => {
        const uiNode = _.find(uiEq.nodes, { id: node.id }) || {}

        Object.assign(node, uiNode.position)

        if (_.isNil(node.x) || _.isNil(node.y)) {
          unplacedNodes.push(node)
        }
      })

      const unplacedY = (_.maxBy(flow.nodes, 'y') || { y: 0 }).y + 250
      let unplacedX = 50

      unplacedNodes.forEach(node => {
        node.y = unplacedY
        node.x = unplacedX
        unplacedX += 250
      })

      return flows.push({
        location: file,
        version: flow.version,
        name: flow.name,
        nodes: _.filter(flow.nodes, node => !!node),
        catchAll: flow.catchAll,
        startNode: flow.startNode,
        links: flow.links
      })
    })

    return flows
  }

  async saveFlows(flows) {
    const flowsToSave = await Promise.mapSeries(flows, flow => this._prepareSaveFlow(flow))

    for (let { flowPath, uiPath, flowContent, uiContent } of flowsToSave) {
      if (flowPath.includes('/')) {
        mkdirp.sync(path.dirname(flowPath))
      }

      fs.writeFileSync(flowPath, JSON.stringify(flowContent, null, 2))
      fs.writeFileSync(uiPath, JSON.stringify(uiContent, null, 2))
    }

    const flowsDir = path.resolve(this.projectLocation, this.botfile.flowsDir || './flows')

    const searchOptions = { cwd: flowsDir }
    const flowFiles = await Promise.fromCallback(callback => glob('**/*.flow.json', searchOptions, callback))

    flowFiles
      .map(fileName => path.resolve(flowsDir, './' + fileName))
      .filter(filePath => !flowsToSave.find(flow => flow.flowPath === filePath || flow.uiPath === filePath))
      .map(filePath => fs.unlinkSync(filePath))

    this.emit('flowsChanged')
  }

  async _prepareSaveFlow(flow) {
    flow = Object.assign({}, flow, {
      version: '0.1'
    })

    const schemaError = this._validateSchema(flow)
    if (schemaError) {
      throw new Error(schemaError)
    }

    // What goes in the ui.json file
    const uiContent = {
      nodes: flow.nodes.map(node => ({
        id: node.id,
        position: { x: node.x, y: node.y }
      })),
      links: flow.links
    }

    // What goes in the .flow.json file
    const flowContent = {
      version: flow.version,
      startNode: flow.startNode,
      catchAll: flow.catchAll,
      nodes: flow.nodes
    }

    flowContent.nodes.forEach(node => {
      // We remove properties that don't belong in the .flow.json file
      delete node['x']
      delete node['y']
      delete node['lastModified']
    })

    const relDir = this.botfile.flowsDir || './flows'
    const flowPath = path.resolve(this.projectLocation, relDir, './' + flow.location)
    const uiPath = flowPath.replace(/\.flow\.json/i, '.ui.json')

    return { flowPath, uiPath, flowContent, uiContent }
  }

  _validateSchema(flow) {
    const errorPrefix = `[Flow] Error loading "${flow.location}"`

    if (!flow || !_.isObjectLike(flow)) {
      return errorPrefix + ', invalid JSON flow schema'
    }

    if (!flow.version || !_.isString(flow.version)) {
      return errorPrefix + ', expected valid version but found none'
    }

    if (!flow.version.startsWith('0.')) {
      return errorPrefix + ', unsupported `version` of the schema "' + flow.version + '"'
    }

    if (!_.isString(flow.startNode)) {
      return errorPrefix + ', expected valid `startNode`'
    }

    if (!_.isArray(flow.nodes)) {
      return errorPrefix + ', expected `nodes` to be an array of nodes'
    }

    if (!_.find(flow.nodes, { name: flow.startNode })) {
      return errorPrefix + ', expected `startNode` to point to an existing flow node'
    }

    if (flow.catchAll) {
      if (flow.catchAll.onEnter) {
        return errorPrefix + ', catchAll does not support "onEnter"'
      }

      if (flow.catchAll.onReceive) {
        if (_.isString(flow.catchAll.onReceive)) {
          flow.catchAll.onReceive = [flow.catchAll.onReceive]
        }
      }

      if (flow.catchAll.next) {
        if (_.isString(flow.catchAll.next)) {
          flow.catchAll.next = [flow.catchAll.next]
        }
      }
    }

    const errs =
      flow.nodes &&
      flow.nodes.map(node => {
        // TODO Better node validation

        // TODO Validate that connections are valid
        // TODO Validate that conditions are valid

        if (!_.isString(node.id) || node.id.length <= 3) {
          return errorPrefix + ', expected all nodes to have a valid id'
        }

        if (_.isString(node.onEnter)) {
          node.onEnter = [node.onEnter]
        }

        if (_.isString(node.onReceive)) {
          node.onReceive = [node.onReceive]
        }

        if (_.isString(node.next)) {
          node.next = [node.next]
        }
      })

    return _.first(errs, e => !!e)
  }
}
