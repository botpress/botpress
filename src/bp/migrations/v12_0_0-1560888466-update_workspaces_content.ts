import * as sdk from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { GhostService } from 'core/services'
import { Migration } from 'core/services/migration'
import { TYPES } from 'core/types'
import { Container } from 'inversify'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Cleanup of workspaces.json to remove unused fields',
    type: 'content'
  },
  up: async (
    bp: typeof sdk,
    configProvider: ConfigProvider,
    database: Database,
    inversify: Container
  ): Promise<sdk.MigrationResult> => {
    const ghost = inversify.get<GhostService>(TYPES.GhostService)
    const workspaces: any = await ghost.global().readFileAsObject('/', `workspaces.json`)
    if (workspaces.length > 1) {
      return { success: false, message: `More than one workspace exist in the file, data would be lost.` }
    }

    const newWorkspace = [
      {
        id: 'default',
        ..._.pick(workspaces[0], ['name', 'bots', 'roles', 'defaultRole', 'adminRole', 'pipeline'])
      }
    ]

    await ghost.global().upsertFile('/', 'workspaces.json', JSON.stringify(newWorkspace, undefined, 2))

    return { success: true }
  }
}

export default migration
