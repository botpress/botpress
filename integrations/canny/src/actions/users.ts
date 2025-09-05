import { RuntimeError } from '@botpress/sdk'
import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'

// User action types
type CreateOrUpdateUserAction = IntegrationProps['actions']['createOrUpdateUser']
type ListUsersAction = IntegrationProps['actions']['listUsers']

export const createOrUpdateUser: CreateOrUpdateUserAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new RuntimeError('Canny API key is not configured. Please add your API key in the integration settings.')
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
    console.log('Creating/updating user:', {
      name: input.name,
      userId: input.userId,
      email: input.email,
    })

    const user = await client.createOrUpdateUser({
      name: input.name,
      userId: input.userId,
      email: input.email,
      avatarURL: input.avatarURL,
      alias: input.alias,
      created: input.created,
      customFields: input.customFields,
    })

    console.log('User created/updated successfully:', user.id)

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
      throw new RuntimeError('Invalid Canny API key. Please check your API key in the integration settings.')
    }

    if (error.response?.status === 400) {
      throw new RuntimeError(`Invalid request: ${error.response?.data?.error || error.message}`)
    }

    if (error.response?.data?.error?.includes('user') || error.message?.includes('user')) {
      throw new RuntimeError(
        `User identification failed: ${error.response?.data?.error || error.message}. Make sure the user is properly identified through Canny Identify SDK.`
      )
    }

    throw new RuntimeError(`Canny API error: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}

export const listUsers: ListUsersAction = async ({ input, ctx }) => {
  if (!ctx.configuration.apiKey) {
    throw new RuntimeError('Canny API key is not configured. Please add your API key in the integration settings.')
  }

  if (input.limit && (input.limit < 1 || input.limit > 100)) {
    throw new RuntimeError('limit must be between 1 and 100')
  }

  const client = CannyClient.create({
    apiKey: ctx.configuration.apiKey,
  })

  try {
    console.log('Listing users with params:', { limit: input.limit, cursor: input.cursor })

    const result = await client.listUsers({
      limit: input.limit,
      cursor: input.cursor,
    })

    console.log(`Found ${result.users.length} users, hasNextPage: ${result.hasNextPage}`)

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
      hasNextPage: result.hasNextPage,
    }

    if ('cursor' in result && typeof (result as any).cursor === 'string') {
      ;(response as any).cursor = (result as any).cursor
    }

    return response
  } catch (error: any) {
    console.error('Error listing users:', error)

    if (error.response?.status === 401) {
      throw new RuntimeError('Invalid Canny API key. Please check your API key in the integration settings.')
    }

    throw new RuntimeError(`Canny API error: ${error.response?.data?.error || error.message || 'Unknown error'}`)
  }
}
