import Knex from 'knex'

import { Table } from '../interfaces'

import {
  BotUsersTable,
  DialogSessionTable,
  EventsTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  LogsTable,
  NotificationsTable,
  TasksTable
} from './bot-specific'
import {
  ChannelUsersTable,
  DataRetentionTable,
  ServerMetadataTable,
  WorkspaceInviteCodesTable,
  WorkspaceUsersTable
} from './server-wide'

const tables: typeof Table[] = [
  ServerMetadataTable,
  ChannelUsersTable,
  WorkspaceUsersTable,
  WorkspaceInviteCodesTable,

  LogsTable,
  ChannelUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  KeyValueStoreTable,
  DataRetentionTable,
  EventsTable,
  TasksTable,
  BotUsersTable
]

export default <(new (knex: Knex) => Table)[]>tables
