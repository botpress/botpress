import { Table, ExtendedKnex } from '../interfaces'

import BotsTable from './bots'
import MigrationsTable from './migrations'
import MetadataTable from './metadata'
import ModulesTable from './modules'

const tables: (typeof Table)[] = [BotsTable, MigrationsTable, MetadataTable, ModulesTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
