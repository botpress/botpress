import { z } from '@botpress/sdk'
import { MemberSchema } from 'src/schemas/entities/Member'

export const boardmemberReadInputSchema = z
  .object({
    id: MemberSchema.shape.id.describe('Unique identifier of the member to retrieve'),
  })
  .describe('Input schema for getting a member by its ID')
