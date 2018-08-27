import { ExtendedKnex } from 'botpress-module-sdk'
import Knex from 'knex'

export abstract class Table {
  constructor(public knex: ExtendedKnex) {}

  abstract bootstrap(): Promise<void>

  abstract get name(): string
}

export abstract class DatabaseMigration {
  abstract up(knex: ExtendedKnex): Promise<void>
  abstract down(knex: ExtendedKnex): Promise<void>
}
