import { inject, injectable, postConstruct, tagged } from 'inversify'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import GhostContentService from '../ghost/service'
import { runCode } from '../sandbox/sandbox-launcher'

import { ActionMetadata, extractMetadata } from './metadata'

@injectable()
export default class ActionService {
  constructor(
    @inject(TYPES.GhostService) private ghost: GhostContentService,
    @inject(TYPES.Logger)
    @tagged('name', 'Actions')
    private logger: Logger
  ) {}

  @postConstruct()
  async initialize() {
    await this.ghost.global().addRootFolder('actions', { filesGlob: '*.js' })
    await this.ghost.forAllBots().addRootFolder('actions', { filesGlob: '*.js' })
  }

  forBot(botId: string): ScopedActionService {
    return new ScopedActionService(this.ghost, this.logger, botId)
  }
}

export type ActionDefinition = {
  name: string
  isRemote: boolean
  location: string
}

export class ScopedActionService {
  constructor(private ghost: GhostContentService, private logger, private botId: string) {}

  async listActions(): Promise<ActionDefinition[]> {
    const globalActions = await this.ghost.global().directoryListing('actions', '*.js')
    const localActions = await this.ghost.forBot(this.botId).directoryListing('actions', '*.js')

    const actions: ActionDefinition[] = []

    globalActions.forEach(action => {
      actions.push({
        name: action.replace(/.js$/i, ''),
        isRemote: false,
        location: 'global'
      })
    })

    localActions.forEach(action => {
      actions.push({
        name: action.replace(/.js$/i, ''),
        isRemote: false,
        location: 'local'
      })
    })

    return actions
  }

  private async getActionScript(actionName: string): Promise<string> {
    const actions = await this.listActions()
    const action = actions.find(x => x.name === actionName)

    if (!action) {
      throw new Error(`Action "${actionName}" not found`)
    }

    let code: string
    if (action.location === 'global') {
      code = await this.ghost.global().readFileAsString('actions', action.name + '.js')
    } else {
      code = await this.ghost.forBot(this.botId).readFileAsString('actions', action + '.js')
    }

    return code
  }

  async getActionMetadata(actionName: string): Promise<ActionMetadata> {
    const code = await this.getActionScript(actionName)
    return extractMetadata(code)
  }

  async hasAction(actionName: string): Promise<boolean> {
    const actions = await this.listActions()
    return !!actions.find(x => x.name === actionName)
  }

  async runAction(actionName: string, dialogState: any, incomingEvent: any, actionArgs: any): Promise<any> {
    this.logger.debug(`Running action "${actionName}"`)
    const code = await this.getActionScript(actionName)

    return runCode(
      code,
      {
        event: incomingEvent,
        state: dialogState,
        args: actionArgs
      },
      { timeout: 5000 }
    )
  }
}
