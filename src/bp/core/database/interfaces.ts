import { KnexExtension } from 'common/knex'
import Knex from 'knex'

export abstract class Table {
  constructor(public knex: Knex & KnexExtension) {}
  abstract bootstrap(): Promise<boolean>
  abstract get name(): string
}

export abstract class DatabaseMigration {
  abstract up(knex: Knex): Promise<void>
  abstract down(knex: Knex): Promise<void>
}
