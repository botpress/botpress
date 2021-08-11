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

export function getValidWorkspaceId(workspaces: any[] | undefined, location: Location): string | null {
  const [, urlSection, urlWorkspaceId, urlPage] = location.pathname.split('/')
  if (!workspaces || !workspaces.length) {
    return null
  }

  const urlId = workspaces.find(x => x.workspace === urlWorkspaceId)
  const storageId = workspaces.find(x => x.workspace === getActiveWorkspace())
  return (urlId && urlId.workspace) || (storageId && storageId.workspace) || workspaces[0].workspace
}
