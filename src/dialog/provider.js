import path from 'path'
import fs from 'fs'
import glob from 'glob'
import _ from 'lodash'
import Promise from 'bluebird'
import EventEmitter2 from 'eventemitter2'
import mkdirp from 'mkdirp'

import { validateFlowSchema } from './validator'

export default class FlowProvider extends EventEmitter2 {
  constructor({ logger, botfile, projectLocation, ghostManager }) {
    super({
      wildcard: true,
      maxListeners: 100
    })

    this.logger = logger
    this.botfile = botfile
    this.projectLocation = projectLocation
    this.ghostManager = ghostManager
    this.flowsDir = this.botfile.flowsDir || './flows'

    mkdirp.sync(path.dirname(this.flowsDir))
    this.ghostManager.addRootFolder(this.flowsDir, '**/*.json')
  }

  async loadAll() {
    const flowFiles = await this.ghostManager.directoryListing(this.flowsDir, '.flow.json')

    const flows = await Promise.map(flowFiles, async flowPath => {
      const flow = JSON.parse(await this.ghostManager.readFile(this.flowsDir, flowPath))

      const schemaError = validateFlowSchema(flow)
      if (!flow || schemaError) {
        return flow ? this.logger.warn(schemaError) : null
      }

      const uiEq = JSON.parse(await this.ghostManager.readFile(this.flowsDir, this._uiPath(flowPath)))

      Object.assign(flow, { links: uiEq.links })

      // Take position from UI files or create default position
      let unplacedIndex = -1
      flow.nodes = flow.nodes.map(node => {
        const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
        const placingStep = 250
        unplacedIndex = position ? unplacedIndex : unplacedIndex + 1

        return {
          ...node,
          x: position ? position.x : 50 + unplacedIndex * placingStep,
          y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 }).y + placingStep
        }
      })

      return {
        name: flowPath,
        location: flowPath,
        nodes: _.filter(flow.nodes, node => !!node),
        ..._.pick(flow, 'version', 'catchAll', 'startNode', 'links', 'skillData')
      }
    })

    return flows.filter(Boolean)
  }

  async saveFlows(flows) {
    if (!flows.find(({ flow }) => flow === 'main.flow.json')) {
      throw new Error(`[Flow] Expected flows list to contain 'main.flow.json'`)
    }
    const flowsToSave = await Promise.mapSeries(flows, flow => this._prepareSaveFlow(flow))
    const flowsSavePromises = _.flatten(
      flowsToSave.map(({ flowPath, uiPath, flowContent, uiContent }) => [
        this.ghostManager.upsertFile(this.flowsDir, flowPath, JSON.stringify(flowContent, null, 2)),
        this.ghostManager.upsertFile(this.flowsDir, uiPath, JSON.stringify(uiContent, null, 2))
      ])
    )

    const pathsToOmit = _.flatten(flowsToSave.map(flow => [flow.flowPath, flow.uiPath]))

    const flowFiles = await this.ghostManager.directoryListing(this.flowsDir, '.json', pathsToOmit)
    const flowsDeletePromises = flowFiles.map(filePath => this.ghostManager.deleteFile(this.flowsDir, filePath))

    await Promise.all(flowsSavePromises.concat(flowsDeletePromises))

    this.emit('flowsChanged')
  }

  async _prepareSaveFlow(flow) {
    flow = Object.assign({}, flow, { version: '0.1' })

    const schemaError = validateFlowSchema(flow)
    if (schemaError) {
      throw new Error(schemaError)
    }

    // What goes in the ui.json file
    const uiContent = {
      nodes: flow.nodes.map(node => ({ id: node.id, position: _.pick(node, 'x', 'y') })),
      links: flow.links
    }

    // What goes in the .flow.json file
    const flowContent = {
      ..._.pick(flow, 'version', 'catchAll', 'startNode', 'skillData'),
      nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this._uiPath(flowPath), flowContent, uiContent }
  }

  _uiPath(flowPath) {
    return flowPath.replace(/\.flow\.json/i, '.ui.json')
  }
}
