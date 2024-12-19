import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'proactiveUser',
  version: '0.0.2',
  entities: {
    user: {
      title: 'User',
      description: 'A user of the system',
      schema: z.object({}).title('User').describe('The user object fields'),
    },
  },
  actions: {
    getOrCreateUser: {
      title: 'Get or Create a User',
      description: 'Proactively create a user from a bot',
      input: {
        schema: ({ user }) =>
          z.object({
            name: z.string().optional().title('Name').describe('The name of the user'),
            pictureUrl: z.string().optional().title('Picture URL').describe('The URL of the user profile picture'),
            email: z.string().optional().title('Email').describe('The email of the user'),
            user: user.title('User').describe('The user object fields'),
          }),
      },
      output: {
        schema: () =>
          z.object({
            userId: z.string().title('User ID').describe('The Botpress ID of the created user'),
          }),
      },
    },
  },
})
