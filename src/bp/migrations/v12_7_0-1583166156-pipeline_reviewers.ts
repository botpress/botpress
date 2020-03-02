import * as sdk from 'botpress/sdk'
import { BotService } from 'core/services/bot-service'
import { Migration, MigrationOpts } from 'core/services/migration'
import { WorkspaceService } from 'core/services/workspace-service'
import { TYPES } from 'core/types'

const migration: Migration = {
  info: {
    description: '',
    target: 'core',
    type: 'config'
  },
  up: async ({ bp, configProvider, inversify }: MigrationOpts) => {
    const workspaceService = inversify.get<WorkspaceService>(TYPES.WorkspaceService)
    const workspaces = await workspaceService.getWorkspaces()

    for (const workspace of workspaces) {
      for (const stage of workspace.pipeline) {
        stage.reviewers = []
        stage.minimumApprovals = 0
        stage.reviewSequence = 'parallel'
      }
    }

    await workspaceService.save(workspaces)

    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
