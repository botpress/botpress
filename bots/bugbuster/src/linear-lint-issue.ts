import * as lin from '@linear/sdk'
import * as api from './linear-api-utils'
import * as utils from './utils'

export const lintIssue = async (client: api.LinearApi, issue: lin.Issue): Promise<string[]> => {
  const lints: string[] = []

  const status = client.issueStatus(issue)
  if (status === 'TRIAGE' || status === 'PRODUCTION_DONE') {
    return lints // No linting for TRIAGE or PRODUCTION_DONE
  }

  const { nodes: labels } = await issue.labels()

  const hasType = await utils.promise.some(labels, async (label) => {
    const parent = await label.parent
    return parent?.name === 'type'
  })
  if (!hasType) {
    lints.push(`Issue ${issue.identifier} is missing a type label.`)
  }

  const hasBlockedLabel = await utils.promise.some(labels, async (label) => {
    const parent = await label.parent
    return parent?.name === 'blocked'
  })

  const hasBlockedRelation = await client.isBlockedByOtherIssues(issue)
  if (status === 'BLOCKED' && !hasBlockedLabel && !hasBlockedRelation) {
    lints.push(`Issue ${issue.identifier} is blocked but missing a "blocked" label or a blocking issue.`)
  }

  const hasArea = labels.some((label) => label.name.startsWith('area/'))
  if (!hasArea) {
    lints.push(`Issue ${issue.identifier} is missing an "area/" label.`)
  }

  if (!issue.priority) {
    lints.push(`Issue ${issue.identifier} is missing a priority.`)
  }

  if (!issue.estimate) {
    lints.push(`Issue ${issue.identifier} is missing an estimate.`)
  }

  if (issue.estimate && issue.estimate > 8) {
    lints.push(
      `Issue ${issue.identifier} has an estimate greater than 8 (${issue.estimate}). Consider breaking it down.`
    )
  }

  const hasProject = await issue.project
  const hasGoal = await utils.promise.some(labels, async (label) => {
    const parent = await label.parent
    return parent?.name === 'goal'
  })
  if (!hasProject && !hasGoal) {
    lints.push(`Issue ${issue.identifier} is missing both a project and a goal label.`)
  }

  const hasFormalTitle = issue.title.includes('[') && issue.title.includes(']')
  if (hasFormalTitle) {
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

  return lints
}
