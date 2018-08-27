import path from 'path'
import _ from 'lodash'
import Promise from 'bluebird'
import EventEmitter2 from 'eventemitter2'
import mkdirp from 'mkdirp'

import { validateFlowSchema } from './validator'

const PLACING_STEP = 250

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
    this.ghostManager.addRootFolder(this.flowsDir, { filesGlob: '**/*.json' })
  }

  async loadAll() {
    const flows = await this.ghostManager.directoryListing(this.flowsDir, '.flow.json').map(async flowPath => {
      const [flow, uiEq] = (await Promise.map([flowPath, this._uiPath(flowPath)], filePath =>
        this.ghostManager.readFile(this.flowsDir, filePath)
      )).map(JSON.parse)

      if (!flow) {
        return null
      }

      const schemaError = validateFlowSchema(flow)
      if (schemaError) {
        this.logger.warn(schemaError)
        return null
      }

      flow.links = uiEq.links

      // Take position from UI files or create default position
      let unplacedIndex = -1
      flow.nodes = flow.nodes.map(node => {
        const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
        unplacedIndex = position ? unplacedIndex : unplacedIndex + 1

        return {
          ...node,
          x: position ? position.x : 50 + unplacedIndex * PLACING_STEP,
          y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 }).y + PLACING_STEP
        }
      })

      return {
        name: flowPath,
        location: flowPath,
        nodes: flow.nodes.filter(Boolean),
        ..._.pick(flow, 'version', 'catchAll', 'startNode', 'links', 'skillData', 'timeoutNode')
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
    flow = { ...flow, version: '0.1' }

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
      ..._.pick(flow, 'version', 'catchAll', 'startNode', 'skillData', 'timeoutNode'),
      nodes: flow.nodes.map(node => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this._uiPath(flowPath), flowContent, uiContent }
  }

  _uiPath(flowPath) {
    return flowPath.replace(/\.flow\.json/i, '.ui.json')
  }
}
