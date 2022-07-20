import * as sdk from 'botpress/sdk'
import { Workspace } from 'common/typings'
import _ from 'lodash'

import { MODULE_NAME } from '../constants'

const debug = DEBUG(MODULE_NAME)

const ROLE_CONFIGURATION = [
  {
    id: 'agent',
    name: 'admin.workspace.roles.default.agent.name',
    description: 'admin.workspace.roles.default.agent.description',
    rules: [
      {
        res: '*',
        op: '+r'
      },
      {
        res: `module.${MODULE_NAME}`,
        op: '+r+w'
      },
      { res: 'admin.collaborators.*', op: '-r' },
      { res: 'admin.logs.*', op: '-r' },
      { res: 'admin.roles.*', op: '-r' },
      { res: 'admin.bots.archive', op: '-r' },
      { res: 'bot.flows', op: '-r' },
      { res: 'bot.content', op: '-r' },
      { res: 'studio.*', op: '-r' }
    ]
  }
]

/**
 * Create or update an 'agent' role in all workspaces
 */
const upsertAgentRoles = async (bp: typeof sdk) => {
  const list = () => {
    return bp.ghost.forGlobal().readFileAsObject<Workspace[]>('/', 'workspaces.json')
  }

  const save = (workspaces: Workspace[]) => {
    return bp.ghost.forGlobal().upsertFile('/', 'workspaces.json', JSON.stringify(workspaces, undefined, 2))
  }

  const upsertRole = async (workspaceId: string, data: any) => {
    const workspaces = await list()
    return save(
      workspaces.map(workspace =>
        workspace.id === workspaceId
          ? { ...workspace, roles: _.values(_.merge(_.keyBy(workspace.roles, 'id'), _.keyBy(data, 'id'))) }
          : workspace
      )
    )
  }

  const workspaces = await list()

  debug('Upserting agent role in workspace(s):', _.map(workspaces, 'id'))
  await Promise.map(workspaces, workspace => upsertRole(workspace.id, ROLE_CONFIGURATION))
}

export default upsertAgentRoles
