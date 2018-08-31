import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../interfaces'

import DialogSessionTable from './bot-specific/dialog_sessions'
import BotsTable from './server-wide/bots'
import ChannelUsersTable from './server-wide/channel_users'
import MetadataTable from './server-wide/metadata'
import MigrationsTable from './server-wide/migrations'

const tables: (typeof Table)[] = [BotsTable, DialogSessionTable, MigrationsTable, MetadataTable, ChannelUsersTable]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
