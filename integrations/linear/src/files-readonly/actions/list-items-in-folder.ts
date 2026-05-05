import * as sdk from '@botpress/sdk'
import { getLinearClient } from '../../misc/utils'
import * as mapping from '../mapping'
import * as bp from '.botpress'

const PAGE_SIZE = 50

export const filesReadonlyListItemsInFolder: bp.IntegrationProps['actions']['filesReadonlyListItemsInFolder'] = async ({
  input,
  client,
  ctx,
}) => {
  const { folderId, nextToken: prevToken } = input

  try {
    const linearClient = await getLinearClient({ client, ctx })

    if (!folderId) {
      return await _listTeams(linearClient, prevToken)
    }

    if (folderId.startsWith(mapping.PREFIXES.TEAM)) {
      return await _listTeamIssues(linearClient, folderId, prevToken)
    }

    if (folderId.startsWith(mapping.PREFIXES.PROJECT)) {
      return await _listProjectIssues(linearClient, folderId, prevToken)
    }

    throw new sdk.RuntimeError(`Invalid folderId: ${folderId}`)
  } catch (err: unknown) {
    if (err instanceof sdk.RuntimeError) {
      throw err
    }
    throw new sdk.RuntimeError(`Failed to list items in folder: ${err instanceof Error ? err.message : String(err)}`)
  }
}

const _listTeams = async (linearClient: any, prevToken?: string) => {
  const teams = await linearClient.teams({ after: prevToken, first: PAGE_SIZE })
  const nodes = teams.nodes ?? []

  const items = nodes.map((team: any) => mapping.mapTeamToFolder({ id: team.id, name: team.name, key: team.key }))

  return {
    items,
    meta: { nextToken: teams.pageInfo?.hasNextPage ? teams.pageInfo.endCursor : undefined },
  }
}

const _listTeamIssues = async (linearClient: any, folderId: string, prevToken?: string) => {
  const teamId = folderId.slice(mapping.PREFIXES.TEAM.length)
  const team = await linearClient.team(teamId)

  if (!team) {
    throw new sdk.RuntimeError(`Team not found: ${teamId}`)
  }

  const issues = await team.issues({ after: prevToken, first: PAGE_SIZE })
  const nodes = issues.nodes ?? []

  const items = nodes.map((issue: any) =>
    mapping.mapIssueToFile({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      updatedAt: issue.updatedAt?.toISOString?.() ?? new Date(issue.updatedAt).toISOString(),
      teamKey: team.key,
    })
  )

  const projects = await team.projects({ first: PAGE_SIZE })
  const projectNodes = projects?.nodes ?? []
  if (!prevToken && projectNodes.length > 0) {
    const projectFolders = projectNodes.map((project: any) =>
      mapping.mapProjectToFolder({ id: project.id, name: project.name }, team.key)
    )
    items.unshift(...projectFolders)
  }

  return {
    items,
    meta: { nextToken: issues.pageInfo?.hasNextPage ? issues.pageInfo.endCursor : undefined },
  }
}

const _listProjectIssues = async (linearClient: any, folderId: string, prevToken?: string) => {
  const projectId = folderId.slice(mapping.PREFIXES.PROJECT.length)
  const project = await linearClient.project(projectId)

  if (!project) {
    throw new sdk.RuntimeError(`Project not found: ${projectId}`)
  }

  const issues = await project.issues({ after: prevToken, first: PAGE_SIZE })
  const nodes = issues.nodes ?? []

  const items = await Promise.all(
    nodes.map(async (issue: any) => {
      const team = await issue.team
      return mapping.mapIssueToFile({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        updatedAt: issue.updatedAt?.toISOString?.() ?? new Date(issue.updatedAt).toISOString(),
        teamKey: team?.key,
      })
    })
  )

  return {
    items,
    meta: { nextToken: issues.pageInfo?.hasNextPage ? issues.pageInfo.endCursor : undefined },
  }
}
