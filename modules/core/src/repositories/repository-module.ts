import { AsyncContainerModule, interfaces } from 'inversify'

import { TYPES } from '../misc/types'

import { BotRepository } from './bot-repository'
import { KnexBotRepository } from './knex-bot-repository'

export const RepositoryModule = new AsyncContainerModule(async (bind: interfaces.Bind, unbind: interfaces.Unbind) => {
  bind<BotRepository>(TYPES.BotRepository).to(KnexBotRepository)
})
