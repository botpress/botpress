import { ExtendedKnex } from 'botpress-module-sdk'

import { Table } from '../interfaces'

import DialogSessionTable from './bot-specific/dialog_sessions'
import AuthRolesTable from './server-wide/auth-roles'
import AuthTeamMembersTable from './server-wide/auth-team-members'
import AuthTeamsTable from './server-wide/auth-teams'
import AuthUsersTable from './server-wide/auth-users'
import BotsTable from './server-wide/bots'
import ChannelUsersTable from './server-wide/channel_users'
import MetadataTable from './server-wide/metadata'
import MigrationsTable from './server-wide/migrations'

const tables: (typeof Table)[] = [
  MigrationsTable,
  MetadataTable,
  ChannelUsersTable,
  AuthUsersTable,
  AuthTeamsTable,
  AuthRolesTable,
  AuthTeamMembersTable,
  BotsTable,
  DialogSessionTable
]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
