import { TYPES } from 'core/types'
import { ContainerModule, interfaces } from 'inversify'

import { StateManager } from '../middleware/state-manager'

import { DecisionEngine } from './decision-engine'
import { DialogEngine } from './dialog-engine'
import { FlowNavigator } from './flow/navigator'
import { FlowService } from './flow/service'
import { InstructionFactory } from './instruction/factory'
import { InstructionProcessor } from './instruction/processor'
import { ActionStrategy, StrategyFactory, TransitionStrategy, WaitStrategy } from './instruction/strategy'
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
  bind<StateManager>(TYPES.StateManager)
    .to(StateManager)
    .inSingletonScope()
})
