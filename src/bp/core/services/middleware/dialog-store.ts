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
const ENTITIES_DIR = './entities'

const preparePattern = (pattern: string, matchCase?: boolean) => {
  try {
    let p = pattern || ''
    if (!p.startsWith('^')) {
      p = `^${p}`
    }
    if (!p.endsWith('$')) {
      p = `${p}$`
    }
    return new RegExp(p, matchCase ? '' : 'i')
  } catch (err) {
    console.error('Pattern invalid', err)
  }
}

@injectable()
export class DialogStore {
  private _prompts!: sdk.PromptDefinition[]
  private _variables!: sdk.PrimitiveVarType[]

  private _customTypes: { [botId: string]: sdk.NLU.EntityDefinition[] } = {}
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
    this.promptManager.getCustomTypes = (botId: string) => this._customTypes[botId]

    // Preloading content so we can keep all methods sync for the boxed variable
    const bots = await this.botService.getBotsIds()
    bots.forEach(async botId => {
      await this._reloadEntities(botId)
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
      await this._reloadEntities(botId)
    } else if (type === 'flows') {
      await this._reloadWorkflowVariables(botId)
    }
  }

  private _getValidationData(botId: string, subType?: string): sdk.ValidationData | undefined {
    const entity = this._customTypes[botId]?.find(x => x.id === subType)
    if (!entity) {
      return
    }
    const patterns: any = []
    const elements: any = []

    if (entity.pattern) {
      patterns.push(preparePattern(entity.pattern, entity.matchCase))
    }

    if (entity.occurrences?.length) {
      elements.push(entity.occurrences)
    }

    if (entity.type === 'complex') {
      if (entity.pattern_entities?.length) {
        patterns.push(
          ...entity.pattern_entities.map(name => {
            const item = this._customTypes[botId].find(x => x.id === name)
            return item && !!item.pattern && preparePattern(item.pattern!, item.matchCase)
          })
        )
      }
      if (entity.list_entities?.length) {
        elements.push(
          ...entity.list_entities.map(name => this._customTypes[botId].find(x => x.id === name)?.occurrences)
        )
      }
    }

    return {
      patterns: patterns.filter(Boolean),
      elements: _.flatten<sdk.NLU.EntityDefOccurrence>(elements).filter(Boolean)
    }
  }

  public getVariable(type: string): sdk.PrimitiveVarType | undefined {
    return this._variables.find(x => x.id === type)
  }

  public getVariableConfig(botId: string, wfName: string, varName: string): sdk.FlowVariable | undefined {
    return this._wfVariables[botId]?.[wfName]?.find(x => x.params?.name === varName)
  }

  public getWorkflowVariables(botId: string, wfName: string): { name: string; type: string; subType?: string }[] {
    return (
      this._wfVariables[botId]?.[wfName]?.map(x => ({
        name: x.params.name,
        type: x.type,
        subType: x.params.subType
      })) ?? []
    )
  }

  public getPromptConfig(type: string): sdk.PromptConfig | undefined {
    return this._prompts.find(x => x.id === type)?.config
  }

  public getBoxedVar(
    data: Omit<sdk.BoxedVarContructor<any>, 'getValidationData'>,
    botId: string,
    workflowName: string,
    variableName: string
  ) {
    const { type, subType, value, nbOfTurns, config: optConfig } = data

    const BoxedVar = this.getVariable(type)?.box
    if (BoxedVar) {
      const config = optConfig ?? this.getVariableConfig(botId, workflowName, variableName)?.params

      const getValidationData = () => this._getValidationData(botId, subType)
      return new BoxedVar({ type, subType, nbOfTurns, value, config, getValidationData })
    }
  }

  private async _reloadEntities(botId: string) {
    const enumFiles = await this.ghost.forBot(botId).directoryListing(ENTITIES_DIR, '*.json')

    this._customTypes[botId] = await Promise.mapSeries(enumFiles, name =>
      this.ghost.forBot(botId).readFileAsObject<sdk.NLU.EntityDefinition>(ENTITIES_DIR, name)
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
