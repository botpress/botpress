import Knex from 'knex'

import { Table } from '../interfaces'

import {
  DialogSessionTable,
  EventsTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  LogsTable,
  NotificationsTable
} from './bot-specific'

import {
  ChannelUsersTable,
  DataRetentionTable,
  MigrationsTable,
  ServerMetadataTable,
  WorkspaceUsersTable
} from './server-wide'

const tables: (typeof Table)[] = [
  MigrationsTable,
  ServerMetadataTable,
  ChannelUsersTable,
  WorkspaceUsersTable,

  LogsTable,
  ChannelUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  KeyValueStoreTable,
  DataRetentionTable,
  EventsTable
]

export default <(new (knex: Knex) => Table)[]>tables
