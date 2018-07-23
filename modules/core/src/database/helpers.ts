import moment from 'moment'
import Knex from 'knex'
import { KnexExtension } from './interfaces'

export const patchKnex = (knex: Knex): Knex & KnexExtension => {
  const ext = <KnexExtension>{}
  Object.assign(knex, ext)
  return <Knex & KnexExtension>knex
}
