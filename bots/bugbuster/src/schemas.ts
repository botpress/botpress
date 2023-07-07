import { z } from 'zod'

// copied from integrations/github but should be generated when installing the integration
export const githubIssueOpenedType = 'github:issueOpened' as const
export const githubIssueOpened = z.object({
  type: z.literal(githubIssueOpenedType).optional(),
  id: z.number(),
  issueUrl: z.string(),
  repoUrl: z.string(),
  number: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  repositoryName: z.string(),
  repositoryOwner: z.string(),
})

// copied from integrations/linear but should be generated when installing the integration
export const linearCreateIssueInput = z.object({
  title: z.string().min(2).max(1000),
  description: z.string().max(100000).describe('The content of the issue'),
  priority: z.number().optional().describe('0 = none, 1 = urgent, 2 = high, 3 = medium, 4 = low'),
  teamName: z.string().describe('Name of the team to assign the issue to'),
  labels: z.array(z.string()).optional().describe('One or multiple labels to assign to this issue'),
  project: z.string().optional().describe('A project to associate to this issue'),
})

export const linearCreateIssueOutput = z.object({
  issue: z.object({
    id: z.string(),
    number: z.number(),
    identifier: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.number(),
    url: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
})
