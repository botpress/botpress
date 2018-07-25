import { interfaces, AsyncContainerModule } from 'inversify'
import { BotRepository } from './bot-repository'
import { KnexBotRepository } from './knex-bot-repository'
import { TYPES } from '../misc/types'

export const RepositoryModule = new AsyncContainerModule(async (bind: interfaces.Bind, unbind: interfaces.Unbind) => {
  bind<BotRepository>(TYPES.BotRepository).to(KnexBotRepository)
})
