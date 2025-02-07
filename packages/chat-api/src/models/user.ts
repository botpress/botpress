import { schema } from '@bpinternal/opapi'
import z from 'zod'

export const userIdSchema = schema(z.string(), {
  description: 'Identifier of the [User](#schema_user)',
})

export const userSchema = schema(
  z.object({
    id: userIdSchema,
    name: schema(z.string().optional(), {
      description: 'Name of the [User](#schema_user)',
    }),
    pictureUrl: schema(z.string().optional(), { description: 'Picture url of the [User](#schema_user)' }),
    profile: schema(z.string().optional(), {
      description: 'Custom profile data of the [User](#schema_user) encoded as a string',
    }),
    createdAt: schema(z.date(), {
      description: 'Creation date of the [User](#schema_user) in ISO 8601 format',
    }),
    updatedAt: schema(z.date(), {
      description: 'Updating date of the [User](#schema_user) in ISO 8601 format',
    }),
  }),
  {
    description:
      'The user object represents someone interacting with the bot within a specific integration. The same person interacting with a bot in slack and messenger will be represented with two different users.',
  }
)
