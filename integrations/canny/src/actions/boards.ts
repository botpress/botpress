import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'
import { RuntimeError } from '@botpress/sdk'

type ListBoardsAction = IntegrationProps['actions']['listBoards']

export const listBoards: ListBoardsAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new RuntimeError('Canny API key is not configured. Please add your API key in the integration settings.')
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  try {
    const result = await client.listBoards({
      limit: input.limit,
      skip: input.skip,
    })

    const boards = result.boards || []
    const requestedLimit = input.limit || 25
    const hasMore = result.hasMore !== undefined ? result.hasMore : boards.length >= requestedLimit

    return {
      boards: boards.map((board) => ({
        id: board.id,
        name: board.name,
        postCount: board.postCount,
        url: board.url,
        created: board.created,
      })),
      hasMore,
    }
  } catch (error: any) {
    console.error('Error listing boards:', error)

    if (error.response?.status === 401) {
      throw new RuntimeError('Invalid Canny API key. Please check your API key in the integration settings.')
    }

    throw new RuntimeError(`Canny API error: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}
