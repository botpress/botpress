import Knex from 'knex'

import { Table } from '../interfaces'

import {
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  LogsTable,
  NotificationsTable
} from './bot-specific'
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
  ServerMetadataTable,
  ChannelUsersTable,
  AuthUsersTable,
  AuthTeamsTable,
  AuthRolesTable,
  AuthTeamMembersTable,
  BotsTable,
  LogsTable,
  ChannelUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  KeyValueStoreTable
]

export default <(new (knex: Knex) => Table)[]>tables
