import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { GhostService } from 'core/bpfs'
import { Migration, MigrationOpts } from 'core/migration'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Cleanup of workspaces.json to remove unused fields',
    type: 'content'
  },
  up: async ({ inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const ghost = inversify.get<GhostService>(TYPES.GhostService)
    const workspaces: any = await ghost.global().readFileAsObject('/', 'workspaces.json')
    if (workspaces.length > 1) {
      return { success: false, message: 'More than one workspace exist in the file, data would be lost.' }
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
