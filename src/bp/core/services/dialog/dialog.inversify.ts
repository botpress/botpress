import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { DialogEngineV2 } from './engine-v2'
import { FlowNavigator } from './flow/navigator'
import { FlowService } from './flow/service'
import { InstructionFactory } from './instruction/factory'
import { InstructionProcessor } from './instruction/processor'
import { ActionStrategy, StrategyFactory, TransitionStrategy, WaitStrategy } from './instruction/strategy'
import { DialogJanitor } from './janitor'
import { SessionService } from './session/service'

export const DialogContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  // FIXME: Replace DialogEngine by V2 once its safe
  // bind<DialogEngine>(TYPES.DialogEngine)
  //   .to(DialogEngine)
  //   .inSingletonScope()
  bind<DialogEngineV2>(TYPES.DialogEngine)
    .to(DialogEngineV2)
    .inSingletonScope()
  bind<FlowNavigator>(TYPES.FlowNavigator)
    .to(FlowNavigator)
    .inSingletonScope()
  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()
  bind<InstructionFactory>(TYPES.InstructionFactory)
    .to(InstructionFactory)
    .inSingletonScope()
  bind<InstructionProcessor>(TYPES.InstructionProcessor)
    .to(InstructionProcessor)
    .inSingletonScope()
  bind<StrategyFactory>(TYPES.StrategyFactory)
    .to(StrategyFactory)
    .inSingletonScope()
  bind<ActionStrategy>(TYPES.ActionStrategy)
    .to(ActionStrategy)
    .inRequestScope()
  bind<TransitionStrategy>(TYPES.TransitionStrategy)
    .to(TransitionStrategy)
    .inRequestScope()
  bind<WaitStrategy>(TYPES.WaitStrategy)
    .to(WaitStrategy)
    .inRequestScope()
  bind<DialogJanitor>(TYPES.DialogJanitorRunner)
    .to(DialogJanitor)
    .inSingletonScope()
  bind<SessionService>(TYPES.SessionService)
    .to(SessionService)
    .inSingletonScope()
})
