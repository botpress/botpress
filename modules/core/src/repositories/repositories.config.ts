import { ContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { BotRepository } from './bot-repository'
import { KnexBotRepository } from './knex-bot-repository'

export const RepositoriesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<BotRepository>(TYPES.BotRepository).to(KnexBotRepository)
})
