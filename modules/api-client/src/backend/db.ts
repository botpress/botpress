import Knex from 'knex';

import * as sdk from 'botpress/sdk';

const TABLE_NAME = 'bot_clients';

export default class Database {
  private knex: Knex & sdk.KnexExtension;

  constructor(private bp: typeof sdk) {
    this.knex = bp.database;
  }

  public async initialize(): Promise<void> {
    await this.knex.createTableIfNotExists(TABLE_NAME, (table) => {
      table.string('login').notNullable();
      table.primary(['login']);
    });
  }
}
