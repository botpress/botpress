import * as bp from '.botpress'

type FilesReadonlyFile = bp.events.Events['fileCreated']['file']
type FilesReadonlyFolder = bp.events.Events['folderDeletedRecursive']['folder']

export const PREFIXES = {
  TEAM: 'team:',
  PROJECT: 'project:',
  ISSUE: 'issue:',
} as const

export type LinearTeam = {
  id: string
  name: string
  key: string
}

export type LinearProject = {
  id: string
  name: string
}

export type LinearIssue = {
  id: string
  identifier: string
  title: string
  description?: string | null
  updatedAt: string
  teamId?: string
  teamKey?: string
  projectId?: string
}

export const mapTeamToFolder = (team: LinearTeam): FilesReadonlyFolder => ({
  id: `${PREFIXES.TEAM}${team.id}`,
  name: team.name,
  type: 'folder',
  absolutePath: `/${team.key}`,
})

export const mapProjectToFolder = (project: LinearProject, teamKey: string): FilesReadonlyFolder => ({
  id: `${PREFIXES.PROJECT}${project.id}`,
  name: project.name,
  type: 'folder',
  absolutePath: `/${teamKey}/projects/${project.name}`,
})

export const mapIssueToFile = (issue: LinearIssue): FilesReadonlyFile => ({
  id: `${PREFIXES.ISSUE}${issue.id}`,
  name: `${issue.identifier} - ${issue.title}`,
  type: 'file',
  absolutePath: `/${issue.teamKey ?? 'unknown'}/${issue.identifier}.md`,
  lastModifiedDate: issue.updatedAt,
})
