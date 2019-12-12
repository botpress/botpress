import { KnexExtended } from 'botpress/sdk'

export abstract class Table {
  constructor(public knex: KnexExtended) {}
  abstract bootstrap(): Promise<boolean>
  abstract get name(): string
}
