import * as types from '../../types'
import * as lin from '../../utils/linear-utils'

export type IssueLint = {
  message: string
}

export const lintIssue = (issue: lin.Issue, state: types.StateEntry): IssueLint[] => {
  const lints: string[] = []

  if (!_hasLabelOfCategory(issue, 'type')) {
    lints.push(`Issue ${issue.identifier} is missing a type label.`)
  }

  const hasBlockedLabel = _hasLabelOfCategory(issue, 'blocked') || _hasLabelOfCategory(issue, 'blocked-reason')
  const hasBlockedRelation = issue.inverseRelations.nodes.some((relation) => relation.type === 'blocks')

  if (state.commonName === 'BLOCKED' && !hasBlockedLabel && !hasBlockedRelation) {
    lints.push(`Issue ${issue.identifier} is blocked but missing a "blocked-reason" label or a blocking issue.`)
  }
  if (state.type === 'backlog' && issue.assignee) {
    lints.push(`Issue ${issue.identifier} has an assignee but is still in the backlog.`)
  }
  if (state.type === 'started' && !issue.assignee) {
    lints.push(`Issue ${issue.identifier} is started but has no assignee.`)
  }

  const hasArea = issue.labels.nodes.some((label) => label.name.startsWith('area.'))
  if (!hasArea) {
    lints.push(`Issue ${issue.identifier} is missing an "area." label.`)
  }

  if (!issue.priority) {
    lints.push(`Issue ${issue.identifier} is missing a priority.`)
  }

  if (issue.estimate === null && state.commonName !== 'BLOCKED') {
    // blocked issues can be unestimated
    lints.push(`Issue ${issue.identifier} is missing an estimate.`)
  }

  const issueIsEpic = _hasLabel({ issue, label: 'epic', category: 'type' })
  if (issue.estimate && issue.estimate > 8 && !issueIsEpic) {
    lints.push(
      `Issue ${issue.identifier} has an estimate greater than 8 (${issue.estimate}). Consider breaking it down or making it an epic.`
    )
  }

  const issueProject = issue.project
  if (issueProject && issueProject.completedAt) {
    lints.push(
      `Issue ${issue.identifier} is associated with a completed project (${issueProject.name}). Consider removing the project association.`
    )
  }

  if (issue.assignee?.active === false) {
    lints.push(`Issue ${issue.identifier} is assigned to a deactivated user. Consider reassigning the issue.`)
  }

  return lints.map((message) => ({ message }))
}

const _hasLabelOfCategory = (issue: lin.Issue, category: string) => {
  return issue.labels.nodes.some((label) => label.parent?.name === category)
}

const _hasLabel = (props: { issue: lin.Issue; label: string; category?: string }) => {
  const { issue, label, category } = props
  return issue.labels.nodes.some((l) => l.name === label && (category ? l.parent?.name === category : true))
}
