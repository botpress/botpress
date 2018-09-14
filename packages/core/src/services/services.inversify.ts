import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import ActionService from './action/action-service'
import AuthService from './auth/auth-service'
import TeamsService from './auth/teams-service'
import { CMSService } from './cms/cms-service'
import { DialogEngine } from './dialog/engine'
import { FlowNavigator } from './dialog/flow/navigator'
import FlowService from './dialog/flow/service'
import { InstructionFactory } from './dialog/instruction/factory'
import { InstructionProcessor } from './dialog/instruction/processor'
import { ActionStrategy, StrategyFactory, TransitionStrategy, WaitStrategy } from './dialog/instruction/strategy'
import { DialogJanitor } from './dialog/janitor'
import { SessionService } from './dialog/session/service'
import { ObjectCache, StorageDriver } from './ghost'
import DiskStorageDriver from './ghost/disk-driver'
import MemoryObjectCache from './ghost/memory-cache'
import GhostService from './ghost/service'
import { HookService } from './hook/hook-service'
import { LogsJanitor } from './logs/janitor'
import { LogsService } from './logs/service'
import MediaService from './media'
import { EventEngine } from './middleware/event-engine'
import { NotificationsService } from './notification/service'
import { Queue } from './queue'
import MemoryQueue from './queue/memory-queue'
import RealtimeService from './realtime'

export const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<ObjectCache>(TYPES.ObjectCache)
    .to(MemoryObjectCache)
    .inSingletonScope()

  bind<StorageDriver>(TYPES.StorageDriver)
    .to(DiskStorageDriver)
    .inSingletonScope()

  bind<GhostService>(TYPES.GhostService)
    .to(GhostService)
    .inSingletonScope()

  bind<FlowService>(TYPES.FlowService)
    .to(FlowService)
    .inSingletonScope()

  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<MediaService>(TYPES.MediaService)
    .to(MediaService)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
    .inSingletonScope()

  bind<Queue>(TYPES.IncomingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Incoming', context.container.getTagged(TYPES.Logger, 'name', 'IQueue'))
  })

  bind<Queue>(TYPES.OutgoingQueue).toDynamicValue((context: interfaces.Context) => {
    return new MemoryQueue('Outgoing', context.container.getTagged(TYPES.Logger, 'name', 'OQueue'))
  })

  bind<HookService>(TYPES.HookService)
    .to(HookService)
    .inSingletonScope()

  bind<EventEngine>(TYPES.EventEngine)
    .to(EventEngine)
    .inSingletonScope()

  bind<DialogEngine>(TYPES.DialogEngine)
    .to(DialogEngine)
    .inSingletonScope()

  bind<SessionService>(TYPES.SessionService)
    .to(SessionService)
    .inSingletonScope()

  bind<RealtimeService>(TYPES.RealtimeService)
    .to(RealtimeService)
    .inSingletonScope()

  bind<AuthService>(TYPES.AuthService)
    .to(AuthService)
    .inSingletonScope()

  bind<TeamsService>(TYPES.TeamsService)
    .to(TeamsService)
    .inSingletonScope()

  bind<InstructionProcessor>(TYPES.InstructionProcessor)
    .to(InstructionProcessor)
    .inSingletonScope()

  bind<InstructionFactory>(TYPES.InstructionFactory)
    .to(InstructionFactory)
    .inSingletonScope()

  bind<FlowNavigator>(TYPES.FlowNavigator)
    .to(FlowNavigator)
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

  bind<LogsJanitor>(TYPES.LogJanitorRunner)
    .to(LogsJanitor)
    .inSingletonScope()

  bind<LogsService>(TYPES.LogsService)
    .to(LogsService)
    .inSingletonScope()

  bind<NotificationsService>(TYPES.NotificationsService)
    .to(NotificationsService)
    .inSingletonScope()
})
