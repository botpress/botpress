import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { Migration, MigrationOpts } from 'core/migration'
import { StrategyUsersRepository, WorkspaceUsersRepository } from 'core/users'
import { StrategyUserTable } from 'core/users/tables'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Copy existing users from workspaces file to database',
    type: 'database'
  },
  up: async ({ bp, database, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const userRepo = inversify.get<StrategyUsersRepository>(TYPES.StrategyUsersRepository)
    const workspaceRepo = inversify.get<WorkspaceUsersRepository>(TYPES.WorkspaceUsersRepository)

    const strategyTable = new StrategyUserTable()
    await strategyTable.createStrategyTable(database.knex, 'strategy_default')

    try {
      const workspaces: any = await bp.ghost.forGlobal().readFileAsObject('/', 'workspaces.json')
      const users = _.get(workspaces, '[0].users')

      if (!_.isArray(users)) {
        return { success: true, message: 'No users in the workspaces file to migrate.' }
      }

      for (const user of users) {
        await userRepo.createUser({
          email: user.email,
          strategy: 'default',
          tokenVersion: 1,
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
