import { inject, injectable, postConstruct, tagged } from 'inversify'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import { GhostContentService } from '../ghost-content'

import { FlowProvider, FlowView } from '.'

const PLACING_STEP = 250

@injectable()
export default class GhostFlowProvider implements FlowProvider {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowProvider')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService
  ) {}

  @postConstruct()
  async initialize(): Promise<void> {
    await this.ghost.addRootFolder(false, 'flows', { filesGlob: '**/*.json', isBinary: false })
  }

  async loadAll(): Promise<FlowView[]> {
    this.logger.debug('Loading all flows')
    return []
  }

  async saveAll(flows: FlowView[]) {
    return
  }
}
