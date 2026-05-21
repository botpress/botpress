import type { IntegrationDefinitionProps } from '@botpress/sdk'
import {
  findUserInputSchema,
  findUserOutputSchema,
  newIssueInputSchema,
  newIssueOutputSchema,
  newIssuesInputSchema,
  newIssuesOutputSchema,
  updateIssueInputSchema,
  updateIssueOutputSchema,
  findAllUsersInputSchema,
  findAllUsersOutputSchema,
  searchIssuesInputSchema,
  searchIssuesOutputSchema,
  getIssueInputSchema,
  getIssueOutputSchema,
  listProjectsInputSchema,
  listProjectsOutputSchema,
  getIssueTransitionsInputSchema,
  getIssueTransitionsOutputSchema,
  transitionIssueInputSchema,
  transitionIssueOutputSchema,
  listIssueTypesInputSchema,
  listIssueTypesOutputSchema,
  listProjectStatusesInputSchema,
  listProjectStatusesOutputSchema,
  assignIssueInputSchema,
  assignIssueOutputSchema,
  deleteIssueInputSchema,
  deleteIssueOutputSchema,
  countIssuesInputSchema,
  countIssuesOutputSchema,
  pickIssueInputSchema,
  pickIssueOutputSchema,
} from '../misc/custom-schemas'

type SdkActions = NonNullable<IntegrationDefinitionProps['actions']>
type SdkAction = SdkActions[string]

const findUser = {
  title: 'Find User',
  description: 'Find the first Jira user matching a search query',
  input: {
    schema: findUserInputSchema,
  },
  output: {
    schema: findUserOutputSchema,
  },
} satisfies SdkAction

const newIssue = {
  title: 'New Issue',
  description: 'Create a new issue in Jira',
  input: {
    schema: newIssueInputSchema,
  },
  output: {
    schema: newIssueOutputSchema,
  },
} satisfies SdkAction

const newIssues = {
  title: 'New Issues (Batch)',
  description: 'Create up to 50 Jira issues in a single request. Returns both successes and errors.',
  input: {
    schema: newIssuesInputSchema,
  },
  output: {
    schema: newIssuesOutputSchema,
  },
} satisfies SdkAction

const updateIssue = {
  title: 'Update Issue',
  description: 'Update an existing Jira issue',
  input: {
    schema: updateIssueInputSchema,
  },
  output: {
    schema: updateIssueOutputSchema,
  },
} satisfies SdkAction

const findAllUsers = {
  title: 'Find All Users',
  description: 'List Jira users with optional pagination',
  input: {
    schema: findAllUsersInputSchema,
  },
  output: {
    schema: findAllUsersOutputSchema,
  },
} satisfies SdkAction

const searchIssues = {
  title: 'Search Issues',
  description:
    'Search for Jira issues using JQL. When no JQL is provided, returns issues ordered by most recently created. Supports pagination via nextToken.',
  input: {
    schema: searchIssuesInputSchema,
  },
  output: {
    schema: searchIssuesOutputSchema,
  },
} satisfies SdkAction

const getIssue = {
  title: 'Get Issue',
  description: 'Fetch a single Jira issue by key or ID, including its current status, assignee, and type.',
  input: {
    schema: getIssueInputSchema,
  },
  output: {
    schema: getIssueOutputSchema,
  },
} satisfies SdkAction

const listProjects = {
  title: 'List Projects',
  description:
    'List Jira projects visible to the configured user. Supports pagination and an optional name/key query filter.',
  input: {
    schema: listProjectsInputSchema,
  },
  output: {
    schema: listProjectsOutputSchema,
  },
} satisfies SdkAction

const getIssueTransitions = {
  title: 'Get Issue Transitions',
  description:
    'List the workflow transitions currently available for a Jira issue. Use the returned transition ID with transitionIssue.',
  input: {
    schema: getIssueTransitionsInputSchema,
  },
  output: {
    schema: getIssueTransitionsOutputSchema,
  },
} satisfies SdkAction

const transitionIssue = {
  title: 'Transition Issue',
  description:
    'Apply a workflow transition to a Jira issue (for example, move it to In Progress or Done). Use getIssueTransitions to find a valid transitionId.',
  input: {
    schema: transitionIssueInputSchema,
  },
  output: {
    schema: transitionIssueOutputSchema,
  },
} satisfies SdkAction

const listIssueTypes = {
  title: 'List Issue Types',
  description: 'List all Jira issue types visible to the configured user.',
  input: {
    schema: listIssueTypesInputSchema,
  },
  output: {
    schema: listIssueTypesOutputSchema,
  },
} satisfies SdkAction

const listProjectStatuses = {
  title: 'List Project Statuses',
  description: 'List the workflow statuses available in a Jira project, grouped per issue type.',
  input: {
    schema: listProjectStatusesInputSchema,
  },
  output: {
    schema: listProjectStatusesOutputSchema,
  },
} satisfies SdkAction

const assignIssue = {
  title: 'Assign Issue',
  description:
    'Assign or unassign a Jira issue. Pass an account ID (find one via findUser) to assign, or null to unassign.',
  input: { schema: assignIssueInputSchema },
  output: { schema: assignIssueOutputSchema },
} satisfies SdkAction

const deleteIssue = {
  title: 'Delete Issue',
  description:
    'Permanently delete a Jira issue. Set deleteSubtasks=true to recursively delete its subtasks; otherwise the call fails if the issue has children.',
  input: { schema: deleteIssueInputSchema },
  output: { schema: deleteIssueOutputSchema },
} satisfies SdkAction

const countIssues = {
  title: 'Count Issues',
  description:
    'Return the approximate number of issues matching a JQL query. Cheaper than paginating searchIssues when you only need a count.',
  input: { schema: countIssuesInputSchema },
  output: { schema: countIssuesOutputSchema },
} satisfies SdkAction

const pickIssue = {
  title: 'Pick Issue',
  description:
    'Find Jira issues by free-text query (matches keys and summaries, ranked by relevance). Use this when the user references an issue by description rather than key.',
  input: { schema: pickIssueInputSchema },
  output: { schema: pickIssueOutputSchema },
} satisfies SdkAction

export const actions = {
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
} satisfies SdkActions
