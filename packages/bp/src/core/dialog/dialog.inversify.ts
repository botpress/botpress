import { TYPES } from 'core/app/types'
import { StateManager } from 'core/dialog'
import { ContainerModule, interfaces } from 'inversify'

import { DecisionEngine } from './decision-engine'
import { DialogEngine } from './dialog-engine'
import { FlowService } from './flow/flow-service'
import { FlowNavigator } from './flow/navigator'
import { InstructionFactory } from './instruction/factory'
import { InstructionProcessor } from './instruction/processor'
import { ActionStrategy, TransitionStrategy } from './instruction/strategy'
import { DialogJanitor } from './janitor'

export const DialogContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<DialogEngine>(TYPES.DialogEngine)
    .to(DialogEngine)
    .inSingletonScope()
  bind<DecisionEngine>(TYPES.DecisionEngine)
    .to(DecisionEngine)
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
  bind<ActionStrategy>(TYPES.ActionStrategy)
    .to(ActionStrategy)
    .inRequestScope()
  bind<TransitionStrategy>(TYPES.TransitionStrategy)
    .to(TransitionStrategy)
    .inRequestScope()
  bind<DialogJanitor>(TYPES.DialogJanitorRunner)
    .to(DialogJanitor)
    .inSingletonScope()
  bind<StateManager>(TYPES.StateManager)
    .to(StateManager)
    .inSingletonScope()
})
