import { z } from '@botpress/sdk'

export const jiraUserSchema = z.object({
  self: z.string().optional().title('Self URL').describe('Jira API URL for the user'),
  key: z.string().optional().title('User Key').describe('Legacy Jira user key, when available'),
  accountId: z.string().optional().title('Account ID').describe('Jira account ID for the user'),
  accountType: z.string().optional().title('Account Type').describe('Jira account type for the user'),
  name: z.string().optional().title('Name').describe('Legacy Jira username, when available'),
  emailAddress: z.string().optional().title('Email Address').describe('Email address for the Jira user, when visible'),
  displayName: z.string().optional().title('Display Name').describe('Display name for the Jira user'),
  active: z.boolean().optional().title('Active').describe('Whether the Jira user account is active'),
  timeZone: z.string().optional().title('Time Zone').describe('User time zone configured in Jira'),
  locale: z.string().optional().title('Locale').describe('User locale configured in Jira'),
})

export const findUserInputSchema = z.object({
  query: z
    .string()
    .title('Query')
    .describe('Search query for a Jira user, such as a name, email, or account identifier'),
})

export const findUserOutputSchema = jiraUserSchema

export const findAllUsersInputSchema = z.object({
  startAt: z.number().int().min(0).optional().title('Start At').describe('Index of the first Jira user to return'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .title('Max Results')
    .describe('Maximum number of Jira users to return (1-100)'),
})

export const findAllUsersOutputSchema = z.object({
  users: z.array(jiraUserSchema).title('Users').describe('Jira users returned by the lookup'),
})

export const newIssueInputSchema = z.object({
  summary: z.string().title('Summary').describe('Summary of the Jira issue to create'),
  description: z.string().optional().title('Description').describe('Detailed description of the Jira issue'),
  issueType: z.string().title('Issue Type').describe('Name of the Jira issue type, such as Task, Story, Bug, or Epic'),
  projectKey: z.string().title('Project Key').describe('Key of the Jira project where the issue is created'),
  parentKey: z.string().optional().title('Parent Key').describe('Parent issue key when creating a sub-task'),
  assigneeId: z.string().optional().title('Assignee ID').describe('Jira account ID of the user assigned to the issue'),
})

export const newIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key of the Jira issue that was created'),
})

export const updateIssueInputSchema = newIssueInputSchema.partial().extend({
  issueKey: z.string().title('Issue Key').describe('Key of the Jira issue to update'),
})

export const updateIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key of the Jira issue that was updated'),
})

export const jiraIssueSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Jira issue key (e.g. SCRUM-17)'),
  id: z.string().optional().title('Issue ID').describe('Internal Jira issue ID'),
  browseUrl: z
    .string()
    .optional()
    .title('Browse URL')
    .describe('User-facing Jira URL for the issue (https://<host>/browse/<KEY>)'),
  summary: z.string().optional().title('Summary').describe('Issue summary'),
  description: z.string().optional().title('Description').describe('Issue description as plain text, when available'),
  status: z.string().optional().title('Status').describe('Current workflow status name'),
  statusCategory: z.string().optional().title('Status Category').describe('Status category (To Do, In Progress, Done)'),
  issueType: z.string().optional().title('Issue Type').describe('Name of the issue type'),
  priority: z.string().optional().title('Priority').describe('Priority name'),
  projectKey: z.string().optional().title('Project Key').describe('Key of the project the issue belongs to'),
  assigneeId: z.string().optional().title('Assignee ID').describe('Account ID of the assigned user'),
  assigneeName: z.string().optional().title('Assignee Name').describe('Display name of the assigned user'),
  reporterId: z.string().optional().title('Reporter ID').describe('Account ID of the reporting user'),
  reporterName: z.string().optional().title('Reporter Name').describe('Display name of the reporting user'),
  parentKey: z.string().optional().title('Parent Key').describe('Issue key of the parent issue, when applicable'),
  created: z.string().optional().title('Created').describe('ISO timestamp of issue creation'),
  updated: z.string().optional().title('Updated').describe('ISO timestamp of last update'),
})

export const searchIssuesInputSchema = z.object({
  jql: z
    .string()
    .optional()
    .title('JQL')
    .describe('JQL query for issue search. Defaults to "order by created DESC" when omitted.'),
  nextToken: z
    .string()
    .optional()
    .title('Next Token')
    .describe('Pagination cursor returned from a previous searchIssues call'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .title('Max Results')
    .describe('Maximum number of issues to return per page (1-100, default 50)'),
})

export const searchIssuesOutputSchema = z.object({
  items: z.array(jiraIssueSchema).title('Items').describe('Issues matching the JQL query'),
  nextToken: z
    .string()
    .optional()
    .title('Next Token')
    .describe('Cursor to pass as nextToken to fetch the next page; omitted when there are no more results'),
})

export const getIssueInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key or ID of the Jira issue to fetch'),
})

export const getIssueOutputSchema = jiraIssueSchema

export const jiraProjectSchema = z.object({
  id: z.string().title('Project ID').describe('Internal Jira project ID'),
  key: z.string().title('Project Key').describe('Project key (e.g. SCRUM)'),
  name: z.string().optional().title('Project Name').describe('Display name of the project'),
  projectTypeKey: z
    .string()
    .optional()
    .title('Project Type')
    .describe('Project type (software, service_desk, business)'),
  description: z.string().optional().title('Description').describe('Project description'),
  leadAccountId: z.string().optional().title('Lead Account ID').describe('Account ID of the project lead'),
  leadName: z.string().optional().title('Lead Name').describe('Display name of the project lead'),
})

export const listProjectsInputSchema = z.object({
  query: z
    .string()
    .optional()
    .title('Query')
    .describe('Optional case-insensitive substring match against project key or name'),
  nextToken: z.string().optional().title('Next Token').describe('Pagination cursor returned from a previous call'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .title('Max Results')
    .describe('Maximum number of projects per page (1-100, default 50)'),
})

export const listProjectsOutputSchema = z.object({
  items: z.array(jiraProjectSchema).title('Items').describe('Projects visible to the configured user'),
  nextToken: z.string().optional().title('Next Token').describe('Cursor for the next page; omitted when no more pages'),
})

export const jiraTransitionSchema = z.object({
  id: z.string().title('Transition ID').describe('ID of the transition (pass to transitionIssue)'),
  name: z.string().optional().title('Transition Name').describe('Display name of the transition'),
  toStatus: z
    .string()
    .optional()
    .title('Target Status')
    .describe('Status the issue moves to when the transition is applied'),
  toStatusCategory: z
    .string()
    .optional()
    .title('Target Status Category')
    .describe('Status category of the target status'),
  isAvailable: z.boolean().optional().title('Available').describe('Whether the transition is currently available'),
  hasScreen: z
    .boolean()
    .optional()
    .title('Has Screen')
    .describe('Whether the transition shows a screen for additional fields'),
})

export const getIssueTransitionsInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key or ID of the issue whose transitions to list'),
})

export const getIssueTransitionsOutputSchema = z.object({
  transitions: z.array(jiraTransitionSchema).title('Transitions').describe('Transitions available for the issue'),
})

export const transitionIssueInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key or ID of the issue to transition'),
  transitionId: z
    .string()
    .title('Transition ID')
    .describe('ID of the transition to apply. Use getIssueTransitions to list valid IDs.'),
  comment: z
    .string()
    .optional()
    .title('Comment')
    .describe('Optional comment to add to the issue as part of the transition'),
})

export const transitionIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key of the issue that was transitioned'),
  transitionId: z.string().title('Transition ID').describe('ID of the transition that was applied'),
})

export const jiraIssueTypeSchema = z.object({
  id: z.string().optional().title('Issue Type ID').describe('Internal Jira issue type ID'),
  name: z.string().optional().title('Name').describe('Issue type name (e.g. Task, Bug, Story)'),
  description: z.string().optional().title('Description').describe('Issue type description'),
  subtask: z.boolean().optional().title('Is Subtask').describe('Whether the issue type represents a subtask'),
  hierarchyLevel: z.number().optional().title('Hierarchy Level').describe('Hierarchy level of the issue type'),
})

export const listIssueTypesInputSchema = z.object({
  projectKey: z
    .string()
    .title('Project Key')
    .describe('Key of the project to list issue types for (e.g. SCRUM). Issue types vary per project.'),
})

export const listIssueTypesOutputSchema = z.object({
  items: z.array(jiraIssueTypeSchema).title('Items').describe('Available issue types'),
})

export const jiraStatusSchema = z.object({
  id: z.string().optional().title('Status ID').describe('Internal Jira status ID'),
  name: z.string().optional().title('Name').describe('Status name (e.g. To Do, In Progress, Done)'),
  description: z.string().optional().title('Description').describe('Status description'),
  category: z.string().optional().title('Category').describe('Status category (To Do, In Progress, Done)'),
  issueType: z.string().optional().title('Issue Type').describe('Issue type the status belongs to'),
})

export const listProjectStatusesInputSchema = z.object({
  projectKey: z.string().title('Project Key').describe('Key or ID of the project'),
})

export const listProjectStatusesOutputSchema = z.object({
  items: z.array(jiraStatusSchema).title('Items').describe('Statuses grouped per issue type for the project'),
})

export const newIssuesInputSchema = z.object({
  issues: z
    .array(newIssueInputSchema)
    .title('Issues')
    .describe('Issues to create in a single request (1-50). Jira enforces a hard limit of 50.'),
})

export const newIssuesOutputSchema = z.object({
  created: z
    .array(z.object({ issueKey: z.string().title('Issue Key').describe('Key of an issue that was created') }))
    .title('Created')
    .describe('Issues that were successfully created'),
  errors: z
    .array(
      z.object({
        index: z.number().optional().title('Input Index').describe('Index in the input array that failed'),
        message: z.string().title('Message').describe('Error message describing why the create failed'),
      })
    )
    .title('Errors')
    .describe('Errors for issues that failed to create. Empty when all issues succeeded.'),
})

export const assignIssueInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key or ID of the issue to assign (e.g. SCRUM-17)'),
  accountId: z
    .string()
    .nullable()
    .title('Assignee Account ID')
    .describe('Jira account ID of the new assignee, or null to unassign'),
})

export const assignIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key of the issue that was assigned'),
  accountId: z
    .string()
    .nullable()
    .title('Assignee Account ID')
    .describe('New assignee account ID, or null if unassigned'),
})

export const deleteIssueInputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key or ID of the issue to delete'),
  deleteSubtasks: z
    .boolean()
    .optional()
    .title('Delete Subtasks')
    .describe(
      'Whether to also delete subtasks of this issue (default false). If false and the issue has subtasks, the API will reject the delete.'
    ),
})

export const deleteIssueOutputSchema = z.object({
  issueKey: z.string().title('Issue Key').describe('Key of the issue that was deleted'),
})

export const countIssuesInputSchema = z.object({
  jql: z.string().title('JQL').describe('JQL query whose matching issues should be counted'),
})

export const countIssuesOutputSchema = z.object({
  count: z
    .number()
    .title('Count')
    .describe(
      'Approximate number of issues matching the JQL. Atlassian returns an estimate optimized for performance, not an exact count.'
    ),
})

export const pickIssueInputSchema = z.object({
  query: z
    .string()
    .title('Query')
    .describe('Free-text query Jira matches against issue keys and summaries (e.g. "login bug")'),
  currentJql: z
    .string()
    .optional()
    .title('Scoping JQL')
    .describe('Optional JQL to restrict the search scope (e.g. "project = SCRUM")'),
})

export const pickIssueOutputSchema = z.object({
  matches: z
    .array(
      z.object({
        issueKey: z.string().title('Issue Key').describe('Key of the matching issue'),
        summary: z.string().optional().title('Summary').describe('Issue summary'),
        section: z
          .string()
          .optional()
          .title('Section')
          .describe('Picker section this match came from (e.g. "History Search", "Current Search")'),
      })
    )
    .title('Matches')
    .describe('Issues matching the query, ranked by relevance and flattened across picker sections'),
})
