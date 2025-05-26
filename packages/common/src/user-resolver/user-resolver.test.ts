import { it, describe, expect, vi } from 'vitest'
import { UserResolverWithCaching } from './user-resolver'
import type { User } from '@botpress/client'

const MOCK_USER_1 = {
  id: 'user-1',
  name: 'User One',
  tags: {},
  createdAt: '',
  updatedAt: '',
} as const satisfies User

const MOCK_USER_2 = {
  id: 'user-2',
  name: 'User Two',
  tags: {},
  createdAt: '',
  updatedAt: '',
} as const satisfies User

const getMocks = () => {
  const getUserMock = vi.fn(async ({ id }: { id: string }) => ({
    user: id === MOCK_USER_1.id ? MOCK_USER_1 : MOCK_USER_2,
  }))

  return {
    getUserMock,
    client: {
      getUser: getUserMock,
    },
  }
}

describe.concurrent('UserResolverWithCaching', () => {
  describe.concurrent('getUser', () => {
    it('should fetch a user from the client when not in cache', async () => {
      // Arrange
      const { client, getUserMock } = getMocks()
      const userResolver = new UserResolverWithCaching(client)

      // Act
      const result = await userResolver.getUser({ id: MOCK_USER_1.id })

      // Assert
      expect(result).toEqual({ user: MOCK_USER_1 })
      expect(getUserMock).toHaveBeenCalledTimes(1)
      expect(getUserMock).toHaveBeenCalledWith({ id: MOCK_USER_1.id })
    })

    it('should return cached user when available', async () => {
      // Arrange
      const { client, getUserMock } = getMocks()
      const userResolver = new UserResolverWithCaching(client)

      // Act
      await userResolver.getUser({ id: MOCK_USER_1.id })
      const result = await userResolver.getUser({ id: MOCK_USER_1.id })
      const result2 = await userResolver.getUser({ id: MOCK_USER_2.id })

      // Assert
      expect(result).toEqual({ user: MOCK_USER_1 })
      expect(result2).toEqual({ user: MOCK_USER_2 })
      expect(getUserMock).toHaveBeenCalledTimes(2)
      expect(getUserMock).toHaveBeenNthCalledWith(1, { id: MOCK_USER_1.id })
      expect(getUserMock).toHaveBeenNthCalledWith(2, { id: MOCK_USER_2.id })
    })
  })
})
