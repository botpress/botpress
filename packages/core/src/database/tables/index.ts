import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../interfaces'

import { DialogSessionTable, GhostFilesTable, GhostRevisionsTable, LogsTable } from './bot-specific'
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
  GhostRevisionsTable
]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
