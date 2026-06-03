import { assignIssue } from './assign-issue'
import { countIssues } from './count-issues'
import { deleteIssue } from './delete-issue'
import { findAllUsers } from './find-all-users'
import { findUser } from './find-user'
import { getIssue } from './get-issue'
import { getIssueTransitions } from './get-issue-transitions'
import { listIssueTypes } from './list-issue-types'
import { listProjectStatuses } from './list-project-statuses'
import { listProjects } from './list-projects'
import { newIssue } from './new-issue'
import { newIssues } from './new-issues'
import { pickIssue } from './pick-issue'
import { searchIssues } from './search-issues'
import { transitionIssue } from './transition-issue'
import { updateIssue } from './update-issue'

export default {
  findUser,
  newIssue,
  newIssues,
  updateIssue,
  assignIssue,
  deleteIssue,
  findAllUsers,
  searchIssues,
  countIssues,
  pickIssue,
  getIssue,
  listProjects,
  getIssueTransitions,
  transitionIssue,
  listIssueTypes,
  listProjectStatuses,
}
