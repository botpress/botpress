import { inject, injectable } from 'inversify'
import { TYPES } from '../misc/types'
import Database from '../database'
import { BotRepository } from './bot-repository'

@injectable()
export class KnexBotRepository implements BotRepository {
  constructor(@inject(TYPES.Database) private database: Database) {}

  async getBotById(id: string) {
    // TODO: Maybe get instead of insert???
    this.database.knex
      .insert({ name: 'Test Bot' })
      .into('srv_bots')
      .then(res => console.log(res))
  }
}
