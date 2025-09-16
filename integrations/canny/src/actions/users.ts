import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { InvalidAPIKeyError, InvalidRequestError, CannyAPIError } from '../misc/errors'
import { IntegrationProps } from '.botpress'

// User action types
type CreateOrUpdateUserAction = IntegrationProps['actions']['createOrUpdateUser']
type ListUsersAction = IntegrationProps['actions']['listUsers']

export const createOrUpdateUser: CreateOrUpdateUserAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new InvalidAPIKeyError()
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  if (!input.name || input.name.trim().length === 0) {
    throw new RuntimeError('name is required and must be between 1-50 characters')
  }
  if (input.name.length > 50) {
    throw new RuntimeError('name must be 50 characters or less')
  }

  try {
    const user = await client.createOrUpdateUser({
      name: input.name,
      userId: input.userId,
      email: input.email,
      avatarURL: input.avatarURL,
      alias: input.alias,
      created: input.created,
      customFields: input.customFields,
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarURL: user.url, // Canny returns avatar in 'url' field
        userId: user.userId,
        isAdmin: user.isAdmin,
        created: user.created,
      },
    }
  } catch (error: any) {
    console.error('Error creating/updating user:', error)

    if (error.response?.status === 401) {
      throw new InvalidAPIKeyError()
    }

    if (error.response?.status === 400) {
      throw new InvalidRequestError(error)
    }

    if (error.response?.data?.error?.includes('user') || error.message?.includes('user')) {
      throw new RuntimeError(
        `User identification failed: ${error.response?.data?.error || error.message}. Make sure the user is properly identified through Canny Identify SDK.`
      )
    }

    throw new CannyAPIError(error)
  }
}

export const listUsers: ListUsersAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new InvalidAPIKeyError()
  }

  if (input.limit && (input.limit < 1 || input.limit > 100)) {
    throw new RuntimeError('limit must be between 1 and 100')
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  try {
    const result = await client.listUsers({
      limit: input.limit,
      cursor: input.nextToken,
    })

    const response = {
      users: result.users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email || '',
        avatarURL: user.url || undefined,
        userId: user.userId || '',
        isAdmin: user.isAdmin,
        created: user.created,
      })),
      nextToken: result.hasNextPage ? (result as any).cursor : undefined,
    }

    return response
  } catch (error: any) {
    console.error('Error listing users:', error)

    if (error.response?.status === 401) {
      throw new InvalidAPIKeyError()
    }

    throw new CannyAPIError(error)
  }
}
