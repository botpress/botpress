import { Logger } from 'botpress/sdk'
import { ModuleLoader } from 'core/module-loader'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { GhostService } from '..'

import { EntityService } from './entities-service'
import { IntentService } from './intent-service'

@injectable()
export class NLUService {
  public entities: EntityService
  public intents: IntentService

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private logger: Logger,
    @inject(TYPES.GhostService)
    private ghostService: GhostService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {
    this.entities = new EntityService(this.ghostService, this)
    this.intents = new IntentService(this.ghostService, this.moduleLoader, this)
  }
}
