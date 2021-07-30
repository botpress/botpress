import { Logger } from 'botpress/sdk'
import { GhostService } from 'core/bpfs'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

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
    private ghostService: GhostService
  ) {
    this.entities = new EntityService(this.ghostService, this)
    this.intents = new IntentService(this.ghostService, this)
  }
}
