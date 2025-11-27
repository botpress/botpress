import { isIssueTitleFormatValid } from './issue-title-format-validator'
import { Issue } from './utils/graphql-queries'
import { StateKey } from './utils/linear-utils'

export type IssueLint = {
  message: string
}

export const lintIssue = async (issue: Issue, status: StateKey): Promise<IssueLint[]> => {
  const lints: string[] = []

  if (!_hasLabelOfCategory(issue, 'type')) {
    lints.push(`Issue ${issue.identifier} is missing a type label.`)
  }

  const hasBlockedLabel = _hasLabelOfCategory(issue, 'blocked')
  const hasBlockedRelation = issue.inverseRelations.nodes.some((relation) => relation.type === 'blocks')

  if (status === 'BLOCKED' && !issue.assignee) {
    lints.push(`Issue ${issue.identifier} is blocked but has no assignee.`)
  }
  if (status === 'BLOCKED' && !hasBlockedLabel && !hasBlockedRelation) {
    lints.push(`Issue ${issue.identifier} is blocked but missing a "blocked" label or a blocking issue.`)
  }
  if (status === 'BACKLOG' && issue.assignee) {
    lints.push(`Issue ${issue.identifier} has an assignee but is still in the backlog.`)
  }

  const hasArea = issue.labels.nodes.some((label) => label.name.startsWith('area/'))
  if (!hasArea) {
    lints.push(`Issue ${issue.identifier} is missing an "area/" label.`)
  }

  if (!issue.priority) {
    lints.push(`Issue ${issue.identifier} is missing a priority.`)
  }

  if (issue.estimate === null && status !== 'BLOCKED') {
    // blocked issues can be unestimated
    lints.push(`Issue ${issue.identifier} is missing an estimate.`)
  }

  if (issue.estimate && issue.estimate > 8) {
    lints.push(
      `Issue ${issue.identifier} has an estimate greater than 8 (${issue.estimate}). Consider breaking it down.`
    )
  }

  const hasProject = issue.project
  const hasGoal = _hasLabelOfCategory(issue, 'goal')
  if (!hasProject && !hasGoal) {
    lints.push(`Issue ${issue.identifier} is missing both a project and a goal label.`)
  }

  if (!isIssueTitleFormatValid(issue.title)) {
    lints.push(
      `Issue ${issue.identifier} has unconventional commit syntax in the title. Issue title should not attempt to follow a formal syntax.`
    )
  }

  const issueProject = await issue.project
  if (issueProject && issueProject.completedAt) {
    lints.push(
      `Issue ${issue.identifier} is associated with a completed project (${issueProject.name}). Consider removing the project association.`
    )
  }

  return lints.map((message) => ({ message }))
}

const _hasLabelOfCategory = (issue: Issue, category: string) => {
  return issue.labels.nodes.some((label) => label.parent?.name === category)
}
