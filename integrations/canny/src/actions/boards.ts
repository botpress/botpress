import { CannyClient } from '../misc/canny-client'
import { InvalidAPIKeyError, CannyAPIError } from '../misc/errors'
import { IntegrationProps } from '.botpress'

type ListBoardsAction = IntegrationProps['actions']['listBoards']

export const listBoards: ListBoardsAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new InvalidAPIKeyError()
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  try {
    const result = await client.listBoards({
      limit: input.limit,
      skip: input.nextToken,
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
      nextToken: hasMore ? (input.nextToken || 0) + (input.limit || 25) : undefined,
    }
  } catch (error: any) {
    console.error('Error listing boards:', error)

    if (error.response?.status === 401) {
      throw new InvalidAPIKeyError()
    }

    throw new CannyAPIError(error)
  }
}
