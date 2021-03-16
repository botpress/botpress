import { DialogSessionTable } from 'core/dialog/sessions/dialog_sessions-table'
import { EventsTable } from 'core/events/event-table'
import { KeyValueStoreTable } from 'core/kvs/kvs-table'
import { LogsTable } from 'core/logger/logs-table'
import { ConversationsTable } from 'core/messaging/conversations-table'
import { MessagesTable } from 'core/messaging/messages-table'
import { TelemetryTable } from 'core/telemetry/telemetry-table'
import {
  WorkspaceInviteCodesTable,
  WorkspaceUsersTable,
  BotUsersTable,
  ChannelUsersTable,
  DataRetentionTable
} from 'core/users/tables'
import Knex from 'knex'

import { Table } from '../interfaces'

import { GhostFilesTable, GhostRevisionsTable, NotificationsTable, TasksTable } from './bot-specific'
import { MigrationsTable, ServerMetadataTable } from './server-wide'

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
