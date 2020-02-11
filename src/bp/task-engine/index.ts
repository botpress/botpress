import * as sdk from 'botpress/sdk'
import { ModuleLoader } from 'core/module-loader'
import { injectable } from 'inversify'
import { inject, tagged } from 'inversify'
import _ from 'lodash'
import plur from 'plur'

import { TYPES } from '../core/types'

import { ActionServer } from './action-server'
import ActionService, { ScopedActionService } from './action-service'

@injectable()
export class TaskEngine {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'TaskEngine')
    private logger: sdk.Logger,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.ActionServer) private actionServer: ActionServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {}
  async start(modules: sdk.ModuleEntryPoint[]) {
    await this.loadModules(modules)
    await this.actionServer.start()
  }

  forBot(botId: string): ScopedActionService {
    return this.actionService.forBot(botId)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }
}
