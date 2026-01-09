import { createComment } from './create-comment'
import { createIssue } from './create-issue'
import { deleteIssue } from './delete-issue'
import { findTarget } from './find-target'
import { getIssue } from './get-issue'
import { getUser } from './get-user'
import { listIssues } from './list-issues'
import { listStates } from './list-states'
import { listTeams } from './list-teams'
import { listUsers } from './list-users'
import { markAsDuplicate } from './mark-as-duplicate'
import { resolveComment } from './resolve-comment'
import { sendRawGraphqlQuery } from './send-raw-graphql-query'
import { updateIssue } from './update-issue'
import * as bp from '.botpress'

export default {
  findTarget,
  getIssue,
  updateIssue,
  getUser,
  listIssues,
  listTeams,
  listUsers,
  listStates,
  markAsDuplicate,
  createIssue,
  deleteIssue,
  sendRawGraphqlQuery,
  resolveComment,
  createComment,
} satisfies Partial<bp.IntegrationProps['actions']>
