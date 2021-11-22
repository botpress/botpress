import Knex from 'knex'
import { GhostFilesTable } from 'runtime/bpfs/ghost_files-table'
import { GhostRevisionsTable } from 'runtime/bpfs/ghost_revisions-table'
import { DialogSessionTable } from 'runtime/dialog/sessions/dialog_sessions-table'
import { EventsTable } from 'runtime/events/event-table'
import { KeyValueStoreTable } from 'runtime/kvs/kvs-table'
import { LogsTable } from 'runtime/logger/logs-table'
import { ServerMetadataTable } from 'runtime/migration/metadata-table'
import { MigrationsTable } from 'runtime/migration/migrations-table'
import { TasksTable } from 'runtime/user-code/action-server/tasks-table'
import { ChannelUsersTable, DataRetentionTable } from 'runtime/users/tables'

import { Table } from './interfaces'

const tables: typeof Table[] = [
  ChannelUsersTable,
  LogsTable,
  ChannelUsersTable,
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  DataRetentionTable,
  EventsTable,
  ServerMetadataTable,
  MigrationsTable,
  TasksTable
]

export default <(new (knex: Knex) => Table)[]>tables
