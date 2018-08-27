import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../interfaces'

import DialogSessionTable from './bot-specific/dialog_sessions'
import BotsTable from './server-wide/bots'
import MetadataTable from './server-wide/metadata'
import MigrationsTable from './server-wide/migrations'
import ModulesTable from './server-wide/modules'

const tables: (typeof Table)[] = [BotsTable, DialogSessionTable, MigrationsTable, MetadataTable, ModulesTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
