import { z } from '@botpress/sdk'
import { MemberSchema } from '../entities/member'

export const getBoardMembersByDisplayNameOutputSchema = z
  .object({
    members: z.array(MemberSchema),
  })
  .describe('Output schema for getting a member from its name')
