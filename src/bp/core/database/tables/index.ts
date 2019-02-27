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

import { ChannelUsersTable, DataRetentionTable, MigrationsTable, ServerMetadataTable } from './server-wide'
import { ConversationsTable } from './server-wide/conversations'
import { MessagesTable } from './server-wide/messages'

// IMPORTANT!: These tables are sorted in order of creation.
const tables: (typeof Table)[] = [
  MigrationsTable,
  ServerMetadataTable,
  ChannelUsersTable,
  ConversationsTable,
  MessagesTable,

  LogsTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  KeyValueStoreTable,
  DataRetentionTable
]

export default <(new (knex: Knex) => Table)[]>tables
