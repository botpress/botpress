import { TYPES } from 'core/app/types'
import { ContainerModule, interfaces } from 'inversify'
import { FlowService } from './flow/flow-service'

export const DialogContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()
})
