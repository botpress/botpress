import knex from 'knex'
import { inject, injectable } from 'inversify'

import { Logger } from '../misc/interfaces'
import { TYPES } from '../misc/types'

@injectable()
export default class Database {

  private _logger: Logger

  public constructor(@inject(TYPES.Logger_Database) logger: Logger) {
    this._logger = logger
  }

  initialize() { }

  runMigrations() {
    // TODO 
  }
}
