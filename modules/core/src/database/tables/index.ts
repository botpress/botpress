import { ExtendedKnex, Table } from '../interfaces'

import BotsTable from './server-wide/bots'
import MetadataTable from './server-wide/metadata'
import MigrationsTable from './server-wide/migrations'
import ModulesTable from './server-wide/modules'

const tables: (typeof Table)[] = [BotsTable, MigrationsTable, MetadataTable, ModulesTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
