import { z } from '@botpress/sdk'

export const sessionSchema = z.object({
  sessionId: z.string().title('Session ID').describe('The ID of the session.'),
  subdomain: z.string().title('Subdomain').describe('The subdomain this session belongs to'),
  branch: z.string().title('Branch').describe('Git branch name where changes were made.').nullable(),
  haulted: z.boolean().title('Haulted').describe('Whether the session execution was halted.'),
  haultReason: z.string().title('Hault reason').describe('Reason for session halt.'),
  pullRequestLink: z.string().title('Pull request link').describe('Link to the created pull request.'),
  messageToUser: z.string().title('Message to user').describe('Message for the user about the session outcome.'),
  todos: z
    .array(
      z.object({
        content: z.string().title('Content').describe('Brief description of the task.'),
        status: z.string().title('Status').describe('Current status of the task.'),
        priority: z.string().title('Priority').describe('Priority level of the task'),
        id: z.string().title('ID').describe('Unique identifier for the todo item.'),
      })
    )
    .title('Todos')
    .describe('List of todo items from the session.'),
  createdAt: z.string().title('Created at').describe('Timestamp when the session was created.'),
})

export const getAgentJobByIdInputSchema = z.object({
  jobId: z.string().title('Job ID').describe('The unique identifier of the agent job to retrieve'),
})

export const getAllAgentJobsOutputSchema = z.object({
  allSessions: z.array(sessionSchema).title('All sessions').describe('Array of all agent sessions for the domain'),
})

export const createAgentJobInputSchema = z.object({
  prompt: z.string().title('Prompt').describe('The prompt to send the Mintlify agent'),
  branchName: z
    .string()
    .title('Branch name')
    .describe(
      "The name of the branch the Mintlify agent will make changes on. If the branch doesn't exist, it'll automatically be created."
    ),
})

export const createAgentJobOutputSchema = z.object({
  response: z
    .string()
    .title('Response')
    .describe('Streaming response containing the agent job execution details and results.'),
})
