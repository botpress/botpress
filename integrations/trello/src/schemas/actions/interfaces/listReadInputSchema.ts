import { z } from '@botpress/sdk'
import { ListSchema } from 'src/schemas/entities/list'

export const listReadInputSchema = z
  .object({
    id: ListSchema.shape.id.describe('Unique identifier of the list to retrieve'),
  })
  .describe('Input schema for getting a list by its ID')
