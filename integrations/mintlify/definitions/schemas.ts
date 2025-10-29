import { z } from '@botpress/sdk'

export const sessionSchema = z.object({
  sessionId: z.string().describe('The ID of the session.'),
  subdomain: z.string().describe('The subdomain this session belongs to'),
  branch: z.string().nullable().describe('Git branch name where changes were made.'),
  haulted: z.boolean().describe('Whether the session execution was halted.'),
  haultReason: z.string().describe('Reason for session halt.'),
  pullRequestLink: z.string().describe('Link to the created pull request.'),
  messageToUser: z.string().describe('Message for the user about the session outcome.'),
  todos: z.array(
    z.object({
      content: z.string().describe('Brief description of the task.'),
      status: z.string().describe('Current status of the task.'),
      priority: z.string().describe('Priority level of the task'),
      id: z.string().describe('Unique identifier for the todo item.'),
    })
  ),
  createdAt: z
    .string()
    .describe('Timestamp when the session was created.')
    .describe('List of todo items from the session.'),
})

export const getAgentJobByIdInputSchema = z.object({
  jobId: z.string().describe('The unique identifier of the agent job to retrieve'),
})

export const getAllAgentJobsOutputSchema = z.object({
  allSessions: z.array(sessionSchema).describe('Array of all agent sessions for the domain'),
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
