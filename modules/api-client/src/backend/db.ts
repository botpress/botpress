import * as sdk from 'botpress/sdk';
import Knex from 'knex';

import { User } from '../types';

const TABLE_NAME = 'users';

export default class Database {
  private knex: Knex & sdk.KnexExtension;

  constructor(private bp: typeof sdk) {
    this.knex = bp.database;
  }

  public async initialize(): Promise<void> {
    await this.knex.createTableIfNotExists(TABLE_NAME, (table) => {
      table.increments('id').primary();
      table.string('login').notNullable();
      table.string('userId').notNullable();
      table.string('channel').notNullable();
      table.json('req_user_data');
    });
  }

  public getUserByLogin(login: string): Promise<[User]> {
    return this.knex(TABLE_NAME)
      .select()
      .where({ login }) as unknown as Promise<[User]>
  }

  public getUserByUserID(userId: string): Promise<[User]> {
    return this.knex(TABLE_NAME)
      .select()
      .where({ userId }) as unknown as Promise<[User]>
  }

  public getUsers(): Promise<User[]> {
    return this.knex(TABLE_NAME)
      .select() as unknown as Promise<User[]>
  }

  public delete(login: string): Promise<number> {
    return this.knex(TABLE_NAME)
      .where('login', login)
      .delete() as unknown as Promise<number>
  }

  public async upsert(user: User): Promise<any> {
    const foundUser = await this.knex(TABLE_NAME)
      .where({ login: user.login });
    if (foundUser.length > 0) {
      return this.knex(TABLE_NAME)
        .where('login', user.login)
        .update({ req_user_data: user.req_user_data, userId: user.userId, channel: user.channel })
        .returning('*');
    }
    return this.knex(TABLE_NAME)
      .insert(user);
  }

  public create(user: User): any {
    return this.knex(TABLE_NAME)
      .insert<User>(user);
  }
}
