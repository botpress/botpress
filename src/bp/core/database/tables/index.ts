import { Knex } from 'bp/common'

import { Table } from '../interfaces'

import { DialogSessionTable, GhostFilesTable, GhostRevisionsTable, LogsTable, NotificationsTable } from './bot-specific'
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
  MigrationsTable,
  LogsTable,
  ServerMetadataTable,
  ChannelUsersTable,
  AuthUsersTable,
  AuthTeamsTable,
  AuthRolesTable,
  AuthTeamMembersTable,
  BotsTable,
  ChannelUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable
]

export default <(new (knex: Knex) => Table)[]>tables
