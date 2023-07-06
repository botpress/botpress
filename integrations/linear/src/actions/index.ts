import { createIssue } from './create-issue'
import { findTarget } from './find-target'
import { getIssue } from './get-issue'
import { getUser } from './get-user'
import { updateIssue } from './update-issue'
import * as botpress from '.botpress'

export default {
  findTarget,
  getIssue,
  updateIssue,
  getUser,
  createIssue,
} satisfies botpress.IntegrationProps['actions']
