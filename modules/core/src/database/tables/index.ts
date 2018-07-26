import { ExtendedKnex, Table } from '../interfaces'

import BotsTable from './bots'
import MetadataTable from './metadata'
import MigrationsTable from './migrations'
import ModulesTable from './modules'

const tables: (typeof Table)[] = [BotsTable, MigrationsTable, MetadataTable, ModulesTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
