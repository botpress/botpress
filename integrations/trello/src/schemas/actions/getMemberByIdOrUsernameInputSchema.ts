import { z } from '@botpress/sdk'

export const getMemberByIdOrUsernameInputSchema = z
  .object({
    memberIdOrUsername: z.string().describe('ID or username of the member to get'),
  })
  .describe('Input schema for getting a member from its ID or username')
