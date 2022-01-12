import Knex from 'knex'

import { GhostFilesTable } from '../bpfs/ghost_files-table'
import { GhostRevisionsTable } from '../bpfs/ghost_revisions-table'
import { DialogSessionTable } from '../dialog/sessions/dialog_sessions-table'
import { EventsTable } from '../events/event-table'
import { KeyValueStoreTable } from '../kvs/kvs-table'
import { LogsTable } from '../logger/logs-table'
import { ServerMetadataTable } from '../migration/metadata-table'
import { MigrationsTable } from '../migration/migrations-table'
import { TelemetryTable } from '../telemetry/telemetry-table'
import { TasksTable } from '../user-code/action-server/tasks-table'
import { ChannelUsersTable, BotUsersTable, DataRetentionTable } from '../users/tables'

import { Table } from './interfaces'

const tables: typeof Table[] = [
  ChannelUsersTable,
  LogsTable,
  BotUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  DataRetentionTable,
  EventsTable,
  ServerMetadataTable,
  MigrationsTable,
  TelemetryTable,
  TasksTable
]

export default <(new (knex: Knex) => Table)[]>tables
