import { z } from '@botpress/sdk'

const addProfileToList = {
  title: 'Add Profile to List',
  description: 'Add a profile to a list in Klaviyo',
  input: {
    schema: z.object({
      listId: z.string().title('List ID').describe('The list id to add the profiles to'),
      profileIds: z.array(z.string()).title('Profile IDs').describe('The list of profile ids to add to the list'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('Whether the profiles were successfully added to the list'),
    }),
  },
}

export const actions = {
  addProfileToList,
} as const
