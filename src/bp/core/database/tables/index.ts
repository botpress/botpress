import { WorkspaceInviteCodesTable, WorkspaceUsersTable } from 'core/collaborators'
import { EventsTable } from 'core/events/event-table'
import { KeyValueStoreTable } from 'core/kvs/kvs-table'
import { LogsTable } from 'core/logger/logs-table'
import Knex from 'knex'

import { Table } from '../interfaces'

import {
  BotUsersTable,
  DialogSessionTable,
  ConversationsTable,
  MessagesTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  TasksTable
} from './bot-specific'
import {
  ChannelUsersTable,
  DataRetentionTable,
  MigrationsTable,
  ServerMetadataTable,
  TelemetryTable
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
  TelemetryTable,
  EventsTable,
  ConversationsTable,
  MessagesTable,
  TasksTable,
  BotUsersTable,
  MigrationsTable
]

export default <(new (knex: Knex) => Table)[]>tables
