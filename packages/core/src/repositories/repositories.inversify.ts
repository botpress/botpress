import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { BotRepository } from './bot-repository'
import { GhostBotRepository } from './ghost-bot-repository'
import { KnexSessionRepository, SessionRepository } from './session-repository'

export const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<BotRepository>(TYPES.BotRepository)
    .to(GhostBotRepository)
    .inSingletonScope()
  bind<SessionRepository>(TYPES.SessionRepository)
    .to(KnexSessionRepository)
    .inSingletonScope()
})
