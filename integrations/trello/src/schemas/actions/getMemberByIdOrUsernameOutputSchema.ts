import { z } from '@botpress/sdk'
import { MemberSchema } from '../entities/member'

export const getMemberByIdOrUsernameOutputSchema = z
  .object({
    member: MemberSchema,
  })
  .describe('Output schema for getting a member by its ID or username')
