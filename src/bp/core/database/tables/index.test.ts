import 'reflect-metadata'

import {
  DialogSessionTable,
  GhostFilesTable,
  GhostRevisionsTable,
  KeyValueStoreTable,
  LogsTable,
  NotificationsTable
} from './bot-specific'
import * as AllTables from './index'
import {
  AuthRolesTable,
  AuthTeamMembersTable,
  AuthTeamsTable,
  AuthUsersTable,
  BotsTable,
  ChannelUsersTable,
  MigrationsTable,
  ServerMetadataTable
} from './server-wide'

describe('Database tables', () => {
  it('Should be ordered', () => {
    const order = [
      MigrationsTable,
      ServerMetadataTable,
      ChannelUsersTable,
      AuthUsersTable,
      AuthTeamsTable,
      AuthRolesTable,
      AuthTeamMembersTable,
      BotsTable,
      LogsTable,
      ChannelUsersTable,
      DialogSessionTable,
      GhostFilesTable,
      GhostRevisionsTable,
      NotificationsTable,
      KeyValueStoreTable
    ]
    expect(AllTables.default).toEqual(order)
  })
})
