import path from 'path'
import fs from 'fs'
import glob from 'glob'
import _ from 'lodash'
import Promise from 'bluebird'
import EventEmitter2 from 'eventemitter2'
import mkdirp from 'mkdirp'

import { validateFlowSchema } from './validator'

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

      const schemaError = validateFlowSchema(flow)
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
        links: flow.links,
        skillData: flow.skillData
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

    const schemaError = validateFlowSchema(flow)
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
      nodes: flow.nodes,
      skillData: flow.skillData
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
}
