import * as sdk from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { ModuleLoader } from 'core/module-loader'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

import { isWebWorker } from '../../../cluster'
import { BotService } from '../bot-service'
import { FlowService } from '../dialog/flow/service'
import { PromptManager } from '../dialog/prompt-manager'
import { GhostService } from '../ghost/service'

interface WorkflowVariables {
  [botId: string]: {
    [workflowName: string]: sdk.FlowVariable[]
  }
}

const DEBOUNCE_DELAY = 2000
const ENUMS_DIR = './entities'

@injectable()
export class DialogStore {
  private _prompts!: sdk.PromptDefinition[]
  private _variables!: sdk.FlowVariableType[]

  private _enums: { [botId: string]: sdk.NLU.EntityDefinition[] } = {}
  private _wfVariables: WorkflowVariables = {}

  constructor(
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.PromptManager) private promptManager: PromptManager,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {
    if (isWebWorker) {
      this.setupInvalidateWatcher()
    }
  }

  @postConstruct()
  private async _init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.BOTPRESS_READY)

    this._prompts = await this.moduleLoader.getPrompts()
    this._variables = await this.moduleLoader.getVariables()

    this.promptManager.prompts = this._prompts

    // Preloading content so we can keep all methods sync for the boxed variable
    const bots = await this.botService.getBotsIds()
    bots.forEach(async botId => {
      await this._reloadEnums(botId)
      await this._reloadWorkflowVariables(botId)
    })
  }

  setupInvalidateWatcher() {
    const debouncedReload = _.debounce(this.reloadContent, DEBOUNCE_DELAY)

    this.cache.events.on('invalidation', async (key: string) => {
      const matches = key.match(/\/bots\/([A-Z0-9-_]+)\/(flows|entities)\//i)
      if (matches && matches.length >= 1) {
        const [, botId, type] = matches
        await debouncedReload(botId, type)
      }
    })
  }

  reloadContent = async (botId: string, type: string) => {
    if (type === 'entities') {
      await this._reloadEnums(botId)
    } else if (type === 'flows') {
      await this._reloadWorkflowVariables(botId)
    }
  }

  public getEnumForBot(botId: string, enumType?: string): sdk.NLU.EntityDefOccurrence[] | undefined {
    return this._enums[botId]?.find(x => x.id === enumType)?.occurrences
  }

  public getVariable(type: string): sdk.FlowVariableType | undefined {
    return this._variables.find(x => x.id === type)
  }

  public getVariableConfig(botId: string, wfName: string, varName: string): sdk.FlowVariable | undefined {
    return this._wfVariables[botId]?.[wfName]?.find(x => x.name === varName)
  }

  public getPromptConfig(type: string): sdk.PromptConfig | undefined {
    return this._prompts.find(x => x.id === type)?.config
  }

  private async _reloadEnums(botId: string) {
    const enumFiles = await this.ghost.forBot(botId).directoryListing(ENUMS_DIR, '*.json')

    this._enums[botId] = await Promise.mapSeries(enumFiles, name =>
      this.ghost.forBot(botId).readFileAsObject<sdk.NLU.EntityDefinition>(ENUMS_DIR, name)
    )
  }

  private async _reloadWorkflowVariables(botId: string) {
    const flows = await this.flowService.loadAll(botId)

    this._wfVariables[botId] = flows.reduce(
      (acc, curr) => ({ ...acc, [curr.name?.replace('.flow.json', '')]: curr.variables ?? [] }),
      {}
    )
  }
}
