import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { StrategyUserTable } from 'core/database/tables/server-wide/strategy_users'
import { StrategyUsersRepository } from 'core/repositories/strategy_users'
import { WorkspaceUsersRepository } from 'core/repositories/workspace_users'
import { GhostService } from 'core/services'
import { Migration } from 'core/services/migration'
import { TYPES } from 'core/types'
import { Container } from 'inversify'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Copy existing users from workspaces file to database',
    type: 'database'
  },
  up: async (
    bp: typeof sdk,
    configProvider: ConfigProvider,
    database: Database,
    inversify: Container
  ): Promise<sdk.MigrationResult> => {
    const userRepo = inversify.get<StrategyUsersRepository>(TYPES.StrategyUsersRepository)
    const workspaceRepo = inversify.get<WorkspaceUsersRepository>(TYPES.WorkspaceUsersRepository)

    const strategyTable = new StrategyUserTable()
    await strategyTable.createStrategyTable(database.knex, `strategy_default`)

    try {
      const workspaces: any = await bp.ghost.forGlobal().readFileAsObject('/', `workspaces.json`)
      const users = _.get(workspaces, '[0].users')

      if (!_.isArray(users)) {
        return { success: true, message: `No users in the workspaces file to migrate.` }
      }

      for (const user of users) {
        await userRepo.createUser({
          email: user.email,
          strategy: 'default',
          password: user.password,
          salt: user.salt,
          attributes: _.pick(user, [
            'last_ip',
            'last_logon',
            'unscuccessful_logins',
            'locked_out',
            'firstname',
            'lastname'
          ])
        })

        await workspaceRepo.createEntry({
          email: user.email,
          strategy: 'default',
          role: user.role,
          workspace: 'default'
        })
      }
    } catch (err) {
      return { success: false, message: `Could not migrate users: ${err.message}` }
    }

    return { success: true }
  }
}

export default migration
