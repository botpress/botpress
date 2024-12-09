import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'proactiveUser',
  version: '0.0.1',
  actions: {
    createUser: {
      title: 'Create User',
      description: 'Proactively create a user from a bot',
      input: {
        schema: () =>
          z.object({
            name: z.string().optional().title('Name').describe('The name of the user'),
            pictureUrl: z.string().optional().title('Picture URL').describe('The URL of the user profile picture'),
            email: z.string().optional().title('Email').describe('The email of the user'),
            tags: z.record(z.string()).optional().title('Tags').describe('The tags to set the user when creating'),
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
