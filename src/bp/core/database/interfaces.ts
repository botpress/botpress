import { KnexExtension } from 'common/knex'
import Knex from 'knex'

export abstract class Table {
  constructor(public knex: Knex & KnexExtension) {}
  abstract bootstrap(): Promise<boolean>
  abstract get name(): string
}

export interface DatabaseMigration {
  up(knex: Knex): Promise<void>
  down(knex: Knex): Promise<void>
}
