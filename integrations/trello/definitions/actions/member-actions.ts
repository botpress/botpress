import { ActionDefinition, z } from '@botpress/sdk'
import { boardSchema, memberSchema } from 'definitions/schemas'
import { hasBoardId, hasCardId, outputsMember, outputsMembers } from './common'

export const getMemberByIdOrUsername = {
  title: 'Get member by ID or username',
  description: 'Get a member by their unique identifier or username',
  input: {
    schema: z
      .object({
        memberIdOrUsername: z
          .union([memberSchema.shape.id, memberSchema.shape.username])
          .title('Member ID or Username')
          .describe('ID or username of the member to get'),
      })
      .describe('Input schema for getting a member from its ID or username'),
  },
  output: {
    schema: outputsMember.describe('Output schema for getting a member by its ID or username'),
  },
} as const satisfies ActionDefinition

export const getAllCardMembers = {
  title: 'Get all card members',
  description: 'Get all members of a card',
  input: {
    schema: hasCardId.describe('Input schema for getting all members of a card'),
  },
  output: {
    schema: outputsMembers.describe('Output schema for getting all members of a card'),
  },
} as const satisfies ActionDefinition

export const getAllBoardMembers = {
  title: 'Get all board members',
  description: 'Get all members of a board',
  input: {
    schema: hasBoardId.describe('Input schema for getting all members of a board'),
  },
  output: {
    schema: outputsMembers.describe('Output schema for getting all members of a board'),
  },
} as const satisfies ActionDefinition

export const getBoardMembersByDisplayName = {
  title: 'Get members by name',
  description: 'Find all members whose display name match this name',
  input: {
    schema: hasBoardId
      .extend({
        displayName: boardSchema.shape.name.title('Display Name').describe('Display name of the member'),
      })
      .describe('Input schema for getting a member from its name'),
  },
  output: {
    schema: outputsMembers.describe('Output schema for getting a member from its name'),
  },
} as const satisfies ActionDefinition
