import { WorkspaceUser } from 'botpress/sdk'
import { Location } from 'history'
import _ from 'lodash'
import { getActiveWorkspace } from '~/auth/basicAuth'

export function filterList<T>(elements: T[], filterFields: string[], query: string): T[] {
  if (!query) {
    return elements
  }

  query = query.toLowerCase()

  return elements.filter(el =>
    filterFields.find(field =>
      _.get(el, field, '')
        .toLowerCase()
        .includes(query)
    )
  )
}

export function getValidWorkspaceId(workspaces: WorkspaceUser[], location: Location): string {
  const [, _, urlWorkspaceId, __] = location.pathname.split('/')

  const urlId = workspaces.find(x => x.workspace === urlWorkspaceId)
  const storageId = workspaces.find(x => x.workspace === getActiveWorkspace())
  return (urlId && urlId.workspace) || (storageId && storageId.workspace) || workspaces[0].workspace
}
