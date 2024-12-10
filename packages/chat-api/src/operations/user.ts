import { schema } from '@bpinternal/opapi'
import z from 'zod'
import { userIdSchema } from '../models/user'
import { authHeaders } from './auth'
import { OperationFunc } from './types'

const section = 'user' as const

const userInput = schema(
  z.object({
    name: schema(z.string().optional(), {
      description: 'Name of the [User](#schema_user) (not a unique identifier)',
    }),
    pictureUrl: schema(z.string().optional(), {
      description: 'Picture url of the [User](#schema_user)',
    }),
    profile: schema(z.string().max(1000).optional(), {
      description: 'Custom profile data of the [User](#schema_user) encoded as a string',
    }),
  })
)

export const getUserOperation: OperationFunc = (api) => ({
  name: 'getUser',
  description: 'Retrieves the [User](#schema_user) object for a valid identifier.',
  method: 'get',
  path: '/users/me',
  parameters: authHeaders,
  section,
  response: {
    description: 'Returns a [User](#schema_user) object if a valid identifier was provided',
    schema: schema(
      z.object({
        user: api.getModelRef('User'),
      })
    ),
  },
})

export const createUserOperation: OperationFunc = (api) => ({
  name: 'createUser',
  description: "Creates a new [User](#schema_user). This operation can't be called when using manual authentication.",
  method: 'post',
  path: '/users',
  requestBody: {
    description: 'User data',
    schema: userInput.extend({ id: userIdSchema.optional() }),
  },
  section,
  response: {
    description: 'Returns a [User](#schema_user)',
    status: 201,
    schema: z.object({
      user: api.getModelRef('User'),
      key: z.string(),
    }),
  },
})

export const getOrCreateUserOperation: OperationFunc = (api) => ({
  name: 'getOrCreateUser',
  description: 'Get or create a new [User](#schema_user)',
  method: 'post',
  path: '/users/get-or-create',
  requestBody: {
    description: 'User data',
    schema: userInput,
  },
  parameters: {
    ...authHeaders,
  },
  section,
  response: {
    description: 'Returns a [User](#schema_user)',
    status: 201,
    schema: z.object({
      user: api.getModelRef('User'),
    }),
  },
})

export const updateUserOperation: OperationFunc = (api) => ({
  name: 'updateUser',
  description: 'Update [User](#schema_user)',
  method: 'put',
  path: '/users/me',
  parameters: authHeaders,
  requestBody: {
    description: 'User data',
    schema: userInput,
  },
  section,
  response: {
    description: 'Returns a [User](#schema_user)',
    status: 200,
    schema: z.object({
      user: api.getModelRef('User'),
    }),
  },
})

export const deleteUserOperation: OperationFunc = () => ({
  name: 'deleteUser',
  description: 'Permanently deletes a [User](#schema_user). It cannot be undone.',
  method: 'delete',
  path: '/users/me',
  parameters: authHeaders,
  section,
  response: {
    description: 'Returns the [User](#schema_user) object that was deleted',
    schema: z.object({}),
  },
})
