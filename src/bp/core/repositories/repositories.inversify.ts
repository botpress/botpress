import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../types'

import {
  KnexNotificationsRepository,
  KnexSessionRepository,
  KnexUserRepository,
  NotificationsRepository,
  SessionRepository,
  UserRepository
} from '.'
import { KnexLogsRepository, LogsRepository } from './logs'

const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<SessionRepository>(TYPES.SessionRepository)
    .to(KnexSessionRepository)
    .inSingletonScope()

  bind<UserRepository>(TYPES.UserRepository)
    .to(KnexUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(KnexLogsRepository)
    .inSingletonScope()

  bind<NotificationsRepository>(TYPES.NotificationsRepository)
    .to(KnexNotificationsRepository)
    .inSingletonScope()
})

export const RepositoriesContainerModules = [RepositoriesContainerModule]
