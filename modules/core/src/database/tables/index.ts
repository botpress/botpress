import { ExtendedKnex, Table } from '../interfaces'

import BotsTable from './bots-table'
import MigrationsTable from './migrations-table'
import ModulesTable from './modules-table'
import MetadataTable from './server-metadata-table'

const tables: (typeof Table)[] = [BotsTable, MigrationsTable, MetadataTable, ModulesTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
