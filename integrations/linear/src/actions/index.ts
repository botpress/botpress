import { createIssue } from './create-issue'
import { findTarget } from './find-target'
import { getIssue } from './get-issue'
import { getUser } from './get-user'
import { listIssues } from './list-issues'
import { listTeams } from './list-teams'
import { markAsDuplicate } from './mark-as-duplicate'
import { updateIssue } from './update-issue'
import * as botpress from '.botpress'

export default {
  findTarget,
  getIssue,
  updateIssue,
  getUser,
  listIssues,
  listTeams,
  markAsDuplicate,
  createIssue,
} satisfies botpress.IntegrationProps['actions']
