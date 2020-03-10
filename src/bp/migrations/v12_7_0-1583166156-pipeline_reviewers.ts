import { Migration, MigrationOpts } from 'core/services/migration'
import { WorkspaceService } from 'core/services/workspace-service'
import { TYPES } from 'core/types'

const migration: Migration = {
  info: {
    description: 'Update stage properties of workspaces.json',
    target: 'core',
    type: 'config'
  },
  up: async ({ inversify }: MigrationOpts) => {
    const workspaceService = inversify.get<WorkspaceService>(TYPES.WorkspaceService)
    const workspaces = await workspaceService.getWorkspaces()
    let changed = false

    for (const workspace of workspaces) {
      for (const stage of workspace.pipeline) {
        if (!stage.reviewers) {
          stage.reviewers = []
          stage.minimumApprovals = 0
          stage.reviewSequence = 'parallel'
          changed = true
        }
      }
    }

    if (changed) {
      await workspaceService.save(workspaces)
    }

    return { success: true, message: changed ? 'Configuration updated successfully' : 'Nothing to update, skipping...' }
  }
}

export default migration
