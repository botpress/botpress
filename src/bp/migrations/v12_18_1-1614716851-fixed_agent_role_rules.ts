import * as sdk from 'botpress/sdk'
import { MigrationOpts } from 'core/services/migration'
import { WorkspaceService } from 'core/services/workspace-service'
import { TYPES } from 'core/types'
import _ from 'lodash'

const AGENT_ROLE_ID = 'agent'
const RULES_TO_ADD = [
  { res: 'admin.collaborators.*', op: '-r' },
  { res: 'admin.logs.*', op: '-r' },
  { res: 'admin.roles.*', op: '-r' }
]

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Alter agent role rules in order to hide sections in admin ui',
    target: 'core',
    type: 'config'
  },
  up: async ({ inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const service = inversify.get<WorkspaceService>(TYPES.WorkspaceService)
    const workspaces = await service.getWorkspaces()

    const alteredWorkspaces = workspaces.map(ws => {
      const agentRole = ws.roles.find(r => r.id === AGENT_ROLE_ID)
      if (!agentRole || _.intersectionBy(agentRole.rules, RULES_TO_ADD, 'res').length === 3) {
        return ws
      }

      return {
        ...ws,
        roles: [
          ...ws.roles.filter(r => r.id !== AGENT_ROLE_ID),
          { ...agentRole, rules: [...agentRole.rules, ...RULES_TO_ADD] }
        ]
      }
    })

    if (!_.isEqual(workspaces, alteredWorkspaces)) {
      await service.save(workspaces)
    }
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
