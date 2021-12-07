import { GhostFilesTable } from 'core/bpfs/ghost_files-table'
import { GhostRevisionsTable } from 'core/bpfs/ghost_revisions-table'
import { EventsTable } from 'core/events/event-table'
import { KeyValueStoreTable } from 'core/kvs/kvs-table'
import { LogsTable } from 'core/logger/logs-table'
import { ServerMetadataTable } from 'core/migration/metadata-table'
import { MigrationsTable } from 'core/migration/migrations-table'
import { TelemetryTable } from 'core/telemetry/telemetry-table'
import { WorkspaceInviteCodesTable, WorkspaceUsersTable } from 'core/users/tables'
import Knex from 'knex'

import { Table } from './interfaces'

const tables: typeof Table[] = [
  ServerMetadataTable,
  WorkspaceUsersTable,
  KeyValueStoreTable,
  WorkspaceInviteCodesTable,
  LogsTable,
  GhostFilesTable,
  EventsTable,
  GhostRevisionsTable,
  TelemetryTable,
  MigrationsTable
]

export default <(new (knex: Knex) => Table)[]>tables
