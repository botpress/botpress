import { z } from 'zod'

export const commonRes = z.object({
  lastSyncId: z.number(),
  success: z.boolean(),
})

export const commonDelete = {
  input: {
    schema: z.object({
      id: z.string(),
    }),
  },
  output: { schema: commonRes },
}

export const issue = z.object({
  boardOrder: z.number(),
  branchName: z.string(),
  createdAt: z.date(),
  customerTicketCount: z.number(),
  id: z.string(),
  identifier: z.string(),
  number: z.number(),
  previousIdentifiers: z.array(z.string()),
  priority: z.number(),
  priorityLabel: z.string(),
  sortOrder: z.number(),
  title: z.string(),
  updatedAt: z.date(),
  url: z.string(),
  archivedAt: z.date().optional(),
  autoArchivedAt: z.date().optional(),
  autoClosedAt: z.date().optional(),
  canceledAt: z.date().optional(),
  completedAt: z.date().optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  estimate: z.number().optional(),
  snoozedUntilAt: z.date().optional(),
  startedAt: z.date().optional(),
  startedTriageAt: z.date().optional(),
  subIssueSortOrder: z.number().optional(),
  trashed: z.boolean().optional(),
  triagedAt: z.date().optional(),
})

export const issueInput = z.object({
  assigneeId: z.string().optional(),
  boardOrder: z.number().optional(),
  createAsUser: z.string().optional(),
  cycleId: z.string().optional(),
  description: z.string().optional(),
  descriptionData: z.record(z.string(), z.string()).optional(),
  displayIconUrl: z.string().optional(),
  dueDate: z.string().optional(),
  estimate: z.number().optional(),
  id: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  parentId: z.string().optional(),
  priority: z.number().optional(),
  projectId: z.string().optional(),
  projectMilestoneId: z.string().optional(),
  referenceCommentId: z.string().optional(),
  slaBreachesAt: z.coerce.date().optional(),
  sortOrder: z.number().optional(),
  stateId: z.string().optional(),
  subIssueSortOrder: z.number().optional(),
  subscriberIds: z.array(z.string()).optional(),
  teamId: z.string(),
  title: z.string(),
})

export const comment = z.object({
  archivedAt: z.string().optional(),
  body: z.string(),
  bodyData: z.string(),
  createdAt: z.string(),
  editedAt: z.string().optional(),
  id: z.string(),
  reactionData: z.record(z.string(), z.any()),
  updatedAt: z.string(),
  url: z.string(),
})

export const commentInput = z.object({
  body: z.string().optional(),
  bodyData: z.record(z.string(), z.any()).optional(),
  createAsUser: z.string().optional(),
  displayIconUrl: z.string().optional(),
  doNotSubscribeToIssue: z.boolean().optional(),
  id: z.string().optional(),
  issueId: z.string(),
  parentId: z.string().optional(),
})

export const issueLabel = z.object({
  color: z.string(),
  createdAt: z.string(),
  id: z.string(),
  name: z.string(),
  archivedAt: z.string().optional(),
  description: z.string().optional(),
})

export const issueLabelInput = z.object({
  color: z.string().optional(),
  description: z.string().optional(),
  id: z.string().optional(),
  name: z.string(),
  parentId: z.string().optional(),
  teamId: z.string().optional(),
})

export const listSchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
  first: z.number().optional(),
  includeArchived: z.boolean().optional(),
  last: z.number().optional(),
})
