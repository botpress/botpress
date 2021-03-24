import * as sdk from 'botpress/sdk'
import { AuthRule, Workspace } from 'common/typings'
import { TYPES } from 'core/app/types'
import { MigrationOpts } from 'core/migration'
import { WorkspaceService } from 'core/users'
import _ from 'lodash'

const AGENT_ROLE_ID = 'agent'
const AGENT_RULES_TO_ADD = [
  { res: 'admin.collaborators.*', op: '-r' },
  { res: 'admin.logs.*', op: '-r' },
  { res: 'admin.roles.*', op: '-r' },
  { res: 'admin.bots.archive', op: '-r' },
  { res: 'bot.flows', op: '-r' },
  { res: 'bot.content', op: '-r' }
]
const EDITOR_ROLE_ID = 'editor'
const EDTITOR_RULES_TO_ADD = [
  { res: 'admin.logs.*', op: '-r' },
  {
    res: 'admin.bots.archive',
    op: '-r'
  }
]

const alterWorkspaceRoleRules = (ws: Workspace, roleID: string, newRules: AuthRule[]): Workspace => {
  const role = ws.roles.find(r => r.id === roleID)
  if (!role || _.intersectionBy(role.rules, newRules, 'res').length === newRules.length) {
    return ws
  }

  return {
    ...ws,
    roles: [...ws.roles.filter(r => r.id !== roleID), { ...role, rules: [...role.rules, ...newRules] }]
  }
}

const migration: sdk.ModuleMigration = {
  info: {
    description: 'Alter some role rules in order to prevent users with low permissions to perform actions',
    target: 'core',
    type: 'content'
  },
  up: async ({ bp, inversify }: MigrationOpts): Promise<sdk.MigrationResult> => {
    const service = inversify.get<WorkspaceService>(TYPES.WorkspaceService)
    let originalWorkspaces
    try {
      originalWorkspaces = await service.getWorkspaces()
    } catch (err) {
      if (err.code === 'ENOENT') {
        return { success: true, message: 'No Workspaces to migrate' }
      } else {
        bp.logger.attachError(err).error('Error reading workspaces.json')
        return { success: false, message: 'Could not migrate workspace roles' }
      }
    }

    const alteredWorkspaces = originalWorkspaces
      .map(ws => alterWorkspaceRoleRules(ws, AGENT_ROLE_ID, AGENT_RULES_TO_ADD))
      .map(ws => alterWorkspaceRoleRules(ws, EDITOR_ROLE_ID, EDTITOR_RULES_TO_ADD))

    if (!_.isEqual(originalWorkspaces, alteredWorkspaces)) {
      await service.save(alteredWorkspaces)
      return { success: true, message: 'Workspaces agent and editor roles have been changed' }
    } else {
      return { success: true, message: 'No Workspaces to migrate' }
    }
  }
}

export default migration
