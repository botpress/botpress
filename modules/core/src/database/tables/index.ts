import { Table, ExtendedKnex } from '../interfaces'

import MigrationsTable from './migrations'
import MetadataTable from './metadata'
import ModulesTable from './modules'

const tables: (typeof Table)[] = [
  MigrationsTable,
  MetadataTable,
  ModulesTable
]

export default <(new (knex: ExtendedKnex) => Table)[]>tables