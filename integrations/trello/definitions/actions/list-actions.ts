import { ActionDefinition, z } from '@botpress/sdk'
import { listSchema } from 'definitions/schemas'
import { hasBoardId, hasListId } from './common'

export const getListById = {
  title: 'Get list by ID',
  description: 'Get a list by its unique identifier',
  input: {
    schema: hasListId.describe('Input schema for getting a list from its ID'),
  },
  output: {
    schema: z.object({
      list: listSchema.title('Trello List').describe("The Trello list that's associated with the given list ID"),
    }),
  },
} as const satisfies ActionDefinition

export const getListsByDisplayName = {
  title: 'Get lists by name',
  description: 'Find all lists whose display name match this name',
  input: {
    schema: hasBoardId
      .extend({
        listName: listSchema.shape.name.title('List Name').describe('Display name of the list'),
      })
      .describe('Input schema for getting a list ID from its name'),
  },
  output: {
    schema: z.object({
      lists: z
        .array(listSchema)
        .title('Trello Lists')
        .describe('A set of lists that are associated with the given board ID and match the given display name'),
    }),
  },
} as const satisfies ActionDefinition

export const getListsInBoard = {
  title: 'Get lists in board',
  description: 'Get all lists in a board',
  input: {
    schema: hasBoardId.describe('Input schema for getting all lists in a board'),
  },
  output: {
    schema: z.object({
      lists: z
        .array(listSchema)
        .title('Trello Lists')
        .describe('A set of all the lists that are associated with the given board ID'),
    }),
  },
} as const satisfies ActionDefinition
