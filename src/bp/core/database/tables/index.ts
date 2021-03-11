import { WorkspaceInviteCodesTable, WorkspaceUsersTable } from 'core/collaborators'
import { DialogSessionTable } from 'core/dialog/sessions/dialog_sessions-table'
import { EventsTable } from 'core/events/event-table'
import { KeyValueStoreTable } from 'core/kvs/kvs-table'
import { LogsTable } from 'core/logger/logs-table'
import { TelemetryTable } from 'core/telemetry/telemetry-table'
import Knex from 'knex'

import { Table } from '../interfaces'

import {
  BotUsersTable,
  ConversationsTable,
  MessagesTable,
  GhostFilesTable,
  GhostRevisionsTable,
  NotificationsTable,
  TasksTable
} from './bot-specific'
import { ChannelUsersTable, DataRetentionTable, MigrationsTable, ServerMetadataTable } from './server-wide'

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
