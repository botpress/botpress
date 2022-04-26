import { GhostFilesTable } from 'core/bpfs/ghost_files-table'
import { GhostRevisionsTable } from 'core/bpfs/ghost_revisions-table'
import { DialogSessionTable } from 'core/dialog/sessions/dialog_sessions-table'
import { EventsTable } from 'core/events/event-table'
import { KeyValueStoreTable } from 'core/kvs/kvs-table'
import { LogsTable } from 'core/logger/logs-table'
import { ChannelsTable } from 'core/messaging/channels-table'
import { ServerMetadataTable } from 'core/migration/metadata-table'
import { MigrationsTable } from 'core/migration/migrations-table'
import { TelemetryTable } from 'core/telemetry/telemetry-table'
import { TasksTable } from 'core/user-code/action-server/tasks-table'
import {
  WorkspaceInviteCodesTable,
  WorkspaceUsersTable,
  BotUsersTable,
  ChannelUsersTable,
  DataRetentionTable
} from 'core/users/tables'
import Knex from 'knex'

import { Table } from './interfaces'

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
  KeyValueStoreTable,
  DataRetentionTable,
  TelemetryTable,
  EventsTable,
  TasksTable,
  BotUsersTable,
  MigrationsTable,
  ChannelsTable
]

export default <(new (knex: Knex) => Table)[]>tables
