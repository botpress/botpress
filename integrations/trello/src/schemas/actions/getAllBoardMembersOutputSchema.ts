import { z } from '@botpress/sdk'
import { MemberSchema } from '../entities/member'

export const getAllBoardMembersOutputSchema = z
  .object({
    members: z.array(MemberSchema),
  })
  .describe('Output schema for getting all members of a board')
