import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../interfaces'

import { DialogSessionTable, LogsTable, NotificationsTable } from './bot-specific'
import {
  AuthRolesTable,
  AuthTeamMembersTable,
  AuthTeamsTable,
  AuthUsersTable,
  BotsTable,
  ChannelUsersTable,
  MigrationsTable,
  ServerMetadataTable
} from './server-wide'

const tables: (typeof Table)[] = [
  LogsTable,
  MigrationsTable,
  ServerMetadataTable,
  ChannelUsersTable,
  AuthUsersTable,
  AuthTeamsTable,
  AuthRolesTable,
  AuthTeamMembersTable,
  BotsTable,
  DialogSessionTable,
  NotificationsTable
]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
