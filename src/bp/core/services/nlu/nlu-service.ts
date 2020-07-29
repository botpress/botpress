import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { GhostService } from '..'

import { EntityService } from './entities-service'
import { IntentService } from './intent-service'

@injectable()
export class NLUService {
  public entityService: EntityService
  public intentService: IntentService

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private logger: Logger,
    @inject(TYPES.GhostService)
    private ghostService: GhostService
  ) {
    this.entityService = new EntityService(this.ghostService)
    this.intentService = new IntentService(this.ghostService)
    this.entityService.load(this.intentService)
    this.intentService.load(this.entityService)
  }
}
