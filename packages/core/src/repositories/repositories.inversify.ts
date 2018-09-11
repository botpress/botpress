import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { BotRepository } from './bot-repository'
import { GhostBotRepository } from './ghost-bot-repository'
import { KnexLogsRepository, LogsRepository } from './logs'
import { KnexSessionRepository, SessionRepository } from './session-repository'
import { KnexUserRepository, UserRepository } from './user-repository'

export const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<BotRepository>(TYPES.BotRepository)
    .to(GhostBotRepository)
    .inSingletonScope()

  bind<SessionRepository>(TYPES.SessionRepository)
    .to(KnexSessionRepository)
    .inSingletonScope()

  bind<UserRepository>(TYPES.UserRepository)
    .to(KnexUserRepository)
    .inSingletonScope()

  bind<LogsRepository>(TYPES.LogsRepository)
    .to(KnexLogsRepository)
    .inSingletonScope()
})
