import { inject, injectable, tagged } from 'inversify'

import { TYPES } from '../../misc/types'

import { FlowProvider, FlowView } from '.'

@injectable()
export default class GhostFlowProvider implements FlowProvider {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowProvider')
    private logger,
    @inject(TYPES.GhostService) private ghost
  ) {}

  async loadAll(): Promise<FlowView[]> {
    return []
  }

  async saveAll(flows: FlowView[]) {
    return
  }
}
