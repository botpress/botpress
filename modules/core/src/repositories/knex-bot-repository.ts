import { inject, injectable } from 'inversify'
import { TYPES } from '../misc/types'
import Database from '../database'
import { BotRepository } from './bot-repository'

@injectable()
export class KnexBotRepository implements BotRepository {
  constructor(@inject(TYPES.Database) private database: Database) {}

  async getBotById(id: string) {
    return this.database.knex
      .select('*')
      .from('srv_bots')
      .where('id', id)
      .then(rows => rows)
  }
}
