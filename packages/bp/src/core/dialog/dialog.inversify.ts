import { TYPES } from 'core/app/types'
import { ContainerModule, interfaces } from 'inversify'

import { FlowService } from './flow/flow-service'
import { FlowNavigator } from './flow/navigator'

export const DialogContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<FlowNavigator>(TYPES.FlowNavigator)
    .to(FlowNavigator)
    .inSingletonScope()
  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()
})
