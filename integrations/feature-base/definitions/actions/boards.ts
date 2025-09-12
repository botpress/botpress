import { ActionDefinition, z } from '@botpress/sdk'

const boardModel = {
  id: z.string().title('id').describe('The unique identifier of the board.'),
  category: z.string().title('Category').describe('The name of the board/category. Example: "Feature Requests"'),
  private: z.boolean().title('Private').optional().describe('Flag indicating whether this board is private.'),
  segmentIds: z.array(z.string()).title('Segment Ids').describe('An array of segment IDs associated with this board.'),
  roles: z.array(z.string()).title('Roles').describe('An array of roles that have access to this board.'),
  hiddenFromRoles: z
    .array(z.string())
    .title('Hidden From Roles')
    .describe('An array of roles that cannot see this board.'),
  disablePostCreation: z
    .boolean()
    .title('Disable Post Creation')
    .optional()
    .describe('Flag indicating whether post creation is disabled for this board.'),
  disableFollowUpQuestions: z
    .boolean()
    .title('Disable Follow Up Questions')
    .optional()
    .describe('Flag indicating whether follow-up questions are disabled for this board.'),
  customInputFields: z
    .array(z.string())
    .title('Custom Input Fields')
    .describe('An array of custom input fields ids that apply to this board.'),
  defaultAuthorOnly: z
    .boolean()
    .title('Default Author Only')
    .optional()
    .describe('Flag indicating whether posts in this board are visible to the author only by default.'),
  defaultCompanyOnly: z
    .boolean()
    .title('Default Company Only')
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
      results: z.array(z.object(boardModel)).title('Results').describe('An array of boards.'),
    }),
  },
} satisfies ActionDefinition

export const getBoard = {
  title: 'Get a board',
  description: 'Get a board by ID',
  input: {
    schema: z.object({
      id: z.string().optional().title('ID').describe('The unique identifier of the board to retrieve.'),
    }),
  },
  output: {
    schema: z.object(boardModel).title('Board').describe('A single board'),
  },
} satisfies ActionDefinition
