import { ExtendedKnex, Table } from '../interfaces'

import DialogSessionTable from './bot-specific/dialog_sessions'
import AuthRolesTable from './server-wide/auth-roles'
import AuthTeamMembersTable from './server-wide/auth-team-members'
import AuthTeamsTable from './server-wide/auth-teams'
import AuthUsersTable from './server-wide/auth-users'
import BotsTable from './server-wide/bots'
import MetadataTable from './server-wide/metadata'
import MigrationsTable from './server-wide/migrations'
import ModulesTable from './server-wide/modules'

const tables: (typeof Table)[] = [
  MigrationsTable,
  MetadataTable,
  ModulesTable,
  AuthUsersTable,
  AuthTeamsTable,
  AuthRolesTable,
  AuthTeamMembersTable,
  BotsTable,
  DialogSessionTable
]

export default <(new (knex: ExtendedKnex) => Table)[]>tables
