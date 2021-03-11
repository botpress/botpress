import { StrategyUsersRepository, WorkspaceInviteCodesRepository, WorkspaceUsersRepository } from 'core/collaborators'
import { SessionRepository } from 'core/dialog'
import { EventRepository } from 'core/events'
import { LogsRepository } from 'core/logger'
import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../types'

import { KnexNotificationsRepository, KnexUserRepository, NotificationsRepository, UserRepository } from '.'

import { ConversationRepository, KnexConversationRepository } from './conversations'

import { KnexMessageRepository, MessageRepository } from './messages'
import { TasksRepository } from './tasks'
import { TelemetryRepository } from './telemetry'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<SessionRepository>(TYPES.SessionRepository)
    .to(SessionRepository)
    .inSingletonScope()

  bind<UserRepository>(TYPES.UserRepository)
    .to(KnexUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(LogsRepository)
    .inSingletonScope()

  bind<NotificationsRepository>(TYPES.NotificationsRepository)
    .to(KnexNotificationsRepository)
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
    .to(KnexMessageRepository)
    .inSingletonScope()

  bind<ConversationRepository>(TYPES.ConversationRepository)
    .to(KnexConversationRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
