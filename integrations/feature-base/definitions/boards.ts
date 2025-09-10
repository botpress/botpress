import { z } from '@botpress/sdk'
const boardModel = {
  id: z.string().describe('The unique identifier of the board.'),
  category: z.string().describe('The name of the board/category. Example: "Feature Requests"'),
  private: z.boolean().optional().describe('Flag indicating whether this board is private.'),
  segmentIds: z.array(z.string()).describe('An array of segment IDs associated with this board.'),
  roles: z.array(z.string()).describe('An array of roles that have access to this board.'),
  hiddenFromRoles: z.array(z.string()).describe('An array of roles that cannot see this board.'),
  disablePostCreation: z
    .boolean()
    .optional()
    .describe('Flag indicating whether post creation is disabled for this board.'),
  disableFollowUpQuestions: z
    .boolean()
    .optional()
    .describe('Flag indicating whether follow-up questions are disabled for this board.'),
  customInputFields: z.array(z.string()).describe('An array of custom input fields ids that apply to this board.'),
  defaultAuthorOnly: z
    .boolean()
    .optional()
    .describe('Flag indicating whether posts in this board are visible to the author only by default.'),
  defaultCompanyOnly: z
    .boolean()
    .optional()
    .describe('Flag indicating whether posts in this board are visible to the company only by default.'),
}

export const listBoards = {
  title: 'List boards',
  description: 'List all boards',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      results: z.array(z.object(boardModel)).describe('An array of boards.'),
    }),
  },
}

export const getBoard = {
  title: 'Get a board',
  description: 'Get a board by ID',
  input: {
    schema: z.object({
      id: z.string().optional().describe('The unique identifier of the board to retrieve.'),
    }),
  },
  output: {
    schema: z.object(boardModel).describe('A single board'),
  },
}
