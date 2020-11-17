import * as sdk from 'botpress/sdk'
import { Workspace } from 'common/typings'
import _ from 'lodash'

export default (bp: typeof sdk) => {
  const list = () => {
    return bp.ghost.forGlobal().readFileAsObject<Workspace[]>('/', 'workspaces.json')
  }

  const save = (workspaces: Workspace[]) => {
    return bp.ghost.forGlobal().upsertFile('/', 'workspaces.json', JSON.stringify(workspaces, undefined, 2))
  }

  // Insert or update a role for a given workspace
  const insertRole = async (workspaceId: string, data: any) => {
    const workspaces = await list()
    return save(
      workspaces.map(workspace =>
        workspace.id === workspaceId
          ? { ...workspace, roles: _.values(_.merge(_.keyBy(workspace.roles, 'id'), _.keyBy(data, 'id'))) }
          : workspace
      )
    )
  }

  return { insertRole }
}
