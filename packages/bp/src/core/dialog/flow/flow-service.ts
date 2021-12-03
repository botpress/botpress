import { Flow, Logger } from 'botpress/sdk'
import { ArrayCache } from 'common/array-cache'
import { ObjectCache } from 'common/object-cache'
import { TreeSearch, PATH_SEPARATOR } from 'common/treeSearch'
import { FlowView, NodeView } from 'common/typings'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService, ScopedGhostService } from 'core/bpfs'
import { JobService } from 'core/distributed/job-service'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import Joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import LRUCache from 'lru-cache'
import ms from 'ms'

import { validateFlowSchema } from '../utils/validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

export const TopicSchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string()
    .optional()
    .allow('')
})

export class MutexError extends Error {
  type = MutexError.name
}

@injectable()
export class FlowService {
  private scopes: { [botId: string]: ScopedFlowService } = {}
  private invalidateFlow: (botId: string, key: string, flow?: FlowView, newKey?: string) => void = this
    ._localInvalidateFlow

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this._listenForCacheInvalidation()
  }

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateFlow = <any>await this.jobService.broadcast<void>(this._localInvalidateFlow.bind(this))
  }

  private _localInvalidateFlow(botId: string, key: string, flow?: FlowView, newKey?: string) {
    return this.forBot(botId).localInvalidateFlow(key, flow, newKey)
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', async key => {
      try {
        const matches = key.match(/^([A-Z0-9-_]+)::data\/bots\/([A-Z0-9-_]+)\/flows\/([\s\S]+(flow)\.json)/i)

        if (matches && matches.length >= 2) {
          const [key, type, botId, flowName] = matches
          if (type === 'file' || type === 'object') {
            await this.forBot(botId).handleInvalidatedCache(flowName, type === 'file')
          }
        }
      } catch (err) {
        this.logger.error('Error Invalidating flow cache: ' + err.message)
      }
    })
  }

  public forBot(botId: string): ScopedFlowService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedFlowService(
        botId,
        this.ghost.forBot(botId),
        this.logger,
        this.botService,
        (key, flow, newKey) => this.invalidateFlow(botId, key, flow, newKey)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedFlowService {
  private cache: ArrayCache<string, FlowView>
  private expectedSavesCache: LRUCache<string, number>

  constructor(
    private botId: string,
    private ghost: ScopedGhostService,
    private logger: Logger,
    private botService: BotService,
    private invalidateFlow: (key: string, flow?: FlowView, newKey?: string) => void
  ) {
    this.cache = new ArrayCache<string, FlowView>(
      x => x.name,
      (x, prevKey, newKey) => ({ ...x, name: newKey, location: newKey })
    )
    this.expectedSavesCache = new LRUCache({ max: 100, maxAge: ms('20s') })
  }

  public async localInvalidateFlow(key: string, flow?: FlowView, newKey?: string) {
    if (!this.cache.values().length) {
      return
    }

    if (flow) {
      this.cache.update(key, flow)
    } else if (newKey) {
      this.cache.rename(key, newKey)
    } else if (this.cache.get(key)) {
      this.cache.remove(key)
    }

    // parent flows are only used by the NDU
    if (await this._isOneFlow()) {
      const flows = this.cache.values()
      const flowsWithParents = this.addParentsToFlows(flows)

      this.cache.initialize(flowsWithParents)
    }
  }

  public async handleInvalidatedCache(flowName: string, isFromFile: boolean) {
    const flowPath = this.toFlowPath(flowName)
    const expectedSaves = this.expectedSavesCache.get(flowPath)

    if (!expectedSaves) {
      // fix an issue when creating a bot where the .flow.json is written but not the .ui.json because of the locking mechanism
      if (!(await this.ghost.fileExists(FLOW_DIR, this.toUiPath(flowPath)))) {
        return
      }

      if (await this.ghost.fileExists(FLOW_DIR, flowPath)) {
        const flow = await this.parseFlow(flowPath)
        await this.localInvalidateFlow(flowPath, flow)
      } else {
        await this.localInvalidateFlow(flowPath, undefined)
      }
    } else {
      if (!isFromFile) {
        this.expectedSavesCache.set(flowPath, expectedSaves - 1)
      }
    }
  }

  async loadAll(): Promise<FlowView[]> {
    if (this.cache.values().length) {
      return this.cache.values()
    }

    const flowsPath = this.ghost.directoryListing(FLOW_DIR, '*.flow.json', undefined, undefined, {
      sortOrder: { column: 'filePath' }
    })

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(flowPath)
      })

      // parent flows are only used by the NDU
      if (await this._isOneFlow()) {
        const flowsWithParents = this.addParentsToFlows(flows)
        this.cache.initialize(flowsWithParents)

        return flowsWithParents
      } else {
        this.cache.initialize(flows)

        return flows
      }
    } catch (err) {
      this.logger
        .forBot(this.botId)
        .attachError(err)
        .error('Could not load flows')
      return []
    }
  }

  @Memoize()
  private async _isOneFlow(): Promise<boolean> {
    const botConfig = await this.botService.findBotById(this.botId)
    return !!botConfig?.oneflow
  }

  private addParentsToFlows(flows: FlowView[]): FlowView[] {
    const tree = new TreeSearch(PATH_SEPARATOR)

    flows.forEach(f => {
      const filename = f.name.replace('.flow.json', '')
      // the value we are looking for is the parent filename
      tree.insert(filename, filename)
    })

    return flows.map(f => {
      const filename = f.name.replace('.flow.json', '')

      return {
        ...f,
        parent: tree.getParent(filename)
      }
    })
  }

  private async parseFlow(flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow, await this._isOneFlow())

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ${schemaError} `)
    }

    const uiEq = await this.ghost.readFileAsObject<FlowView>(FLOW_DIR, this.toUiPath(flowPath))
    let unplacedIndex = -1

    const nodeViews: NodeView[] = flow.nodes.map(node => {
      const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
      unplacedIndex = position ? unplacedIndex : unplacedIndex + 1
      return {
        ...node,
        x: position ? position.x : MIN_POS_X + unplacedIndex * PLACING_STEP,
        y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
      }
    })

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description'])
    }
  }

  private toUiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }

  private toFlowPath(uiPath: string) {
    return uiPath.replace(/\.ui\.json$/i, '.flow.json')
  }
}
