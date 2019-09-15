import { KnexExtension } from 'common/knex'
import Knex from 'knex'

export abstract class Table {
  constructor(public knex: Knex & KnexExtension) {}
  abstract bootstrap(): Promise<boolean>
  abstract get name(): string
}
