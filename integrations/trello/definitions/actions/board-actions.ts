import { ActionDefinition, z } from '@botpress/sdk'
import { boardSchema } from 'definitions/schemas'
import { hasBoardId, noInput, outputsBoard, outputsBoards } from './common'

export const getBoardById = {
  title: 'Get board by ID',
  description: 'Get a board by its unique identifier',
  input: {
    schema: hasBoardId.describe('Input schema for getting a board from its ID'),
  },
  output: {
    schema: outputsBoard.describe('Output schema for getting a board from its ID'),
  },
} as const satisfies ActionDefinition

export const getBoardsByDisplayName = {
  title: 'Get boards by name',
  description: 'Find all boards whose display name match this name',
  input: {
    schema: z
      .object({
        boardName: boardSchema.shape.name.title('Board Name').describe('Display name of the board'),
      })
      .describe('Input schema for getting a board ID from its name'),
  },
  output: {
    schema: outputsBoards.describe('Output schema for getting a board from its name'),
  },
} as const satisfies ActionDefinition

export const getAllBoards = {
  title: 'Get all boards',
  description: 'Get all boards managed by the authenticated user',
  input: {
    schema: noInput.describe('Input schema for getting all boards'),
  },
  output: {
    schema: outputsBoards.describe('Output schema for getting all boards'),
  },
} as const satisfies ActionDefinition
