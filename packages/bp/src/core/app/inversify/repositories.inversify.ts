import { SessionRepository } from 'core/dialog/sessions'
import { EventRepository } from 'core/events'
import { LogsRepository } from 'core/logger'
import { MappingRepository } from 'core/mapping/mapping-repository'
import { ConversationRepository, MessageRepository } from 'core/messaging'
import { TelemetryRepository } from 'core/telemetry'
import { TasksRepository } from 'core/user-code'
import {
  ChannelUserRepository,
  StrategyUsersRepository,
  WorkspaceInviteCodesRepository,
  WorkspaceUsersRepository
} from 'core/users'
import { ContainerModule, interfaces } from 'inversify'
import { TYPES } from '../types'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<SessionRepository>(TYPES.SessionRepository)
    .to(SessionRepository)
    .inSingletonScope()

  bind<ChannelUserRepository>(TYPES.UserRepository)
    .to(ChannelUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(LogsRepository)
    .inSingletonScope()

  bind<EventRepository>(TYPES.EventRepository)
    .to(EventRepository)
    .inSingletonScope()

  bind<StrategyUsersRepository>(TYPES.StrategyUsersRepository)
    .to(StrategyUsersRepository)
    .inSingletonScope()

  bind<TelemetryRepository>(TYPES.TelemetryRepository)
    .to(TelemetryRepository)
    .inSingletonScope()

  bind<WorkspaceUsersRepository>(TYPES.WorkspaceUsersRepository)
    .to(WorkspaceUsersRepository)
    .inSingletonScope()

  bind<WorkspaceInviteCodesRepository>(TYPES.WorkspaceInviteCodesRepository)
    .to(WorkspaceInviteCodesRepository)
    .inSingletonScope()

  bind<TasksRepository>(TYPES.TasksRepository)
    .to(TasksRepository)
    .inSingletonScope()

  bind<MessageRepository>(TYPES.MessageRepository)
    .to(MessageRepository)
    .inSingletonScope()

  bind<ConversationRepository>(TYPES.ConversationRepository)
    .to(ConversationRepository)
    .inSingletonScope()

  bind<MappingRepository>(TYPES.MappingRepository)
    .to(MappingRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
