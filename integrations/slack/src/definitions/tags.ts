import { TagDefinition } from '@botpress/sdk'

export const userTags = {
  dm_conversation_id: {
    title: 'DM Conversation ID',
    description: 'The ID of the conversation used to DM the user (created by calling the `startDmConversation` action)',
  },
  id: {
    title: 'ID',
    description: 'The Slack ID of the user (U0000XXXXXX)',
  },
  tz: {
    title: 'Timezone',
    description: 'The timezone of the user',
  },
  is_bot: {
    title: 'Is a bot',
    description: 'Whether the user is a bot',
  },
  is_admin: {
    title: 'Is an admin',
    description: 'Whether the user is an admin',
  },
  title: {
    title: 'Profile title',
    description: "The on the user's profile",
  },
  phone: {
    title: 'Phone number',
    description: 'The phone number of the user',
  },
  email: {
    title: 'Email',
    description: 'The email address of the user',
  },
  real_name: {
    title: 'Real name',
    description: 'The real name of the user',
  },
  display_name: {
    title: 'Display name',
    description: 'The display name of the user',
  },
  real_name_normalized: {
    title: 'Normalized real name',
    description: 'The normalized real name of the user',
  },
  display_name_normalized: {
    title: 'Normalized display name',
    description: 'The normalized display name of the user',
  },
  avatar_hash: {
    title: 'Avatar hash code',
    description: "A hashed representation of the user avatar's avatar",
  },
  status_text: {
    title: 'Status text',
    description: 'The status text of the user',
  },
  status_emoji: {
    title: 'Status emoji',
    description: 'The status emoji of the user',
  },
  image_24: {
    title: 'Avatar x24',
    description: 'The URL of the user avatar (24x24)',
  },
  image_48: {
    title: 'Avatar x48',
    description: 'The URL of the user avatar (48x48)',
  },
  image_192: {
    title: 'Avatar x192',
    description: 'The URL of the user avatar (192x192)',
  },
  image_512: {
    title: 'Avatar x512',
    description: 'The URL of the user avatar (512x512)',
  },
  image_1024: {
    title: 'Avatar x1024',
    description: 'The URL of the user avatar (1024x1024)',
  },
  team: {
    title: 'Team',
    description: 'The Slack ID of the team (T0000XXXXXX)',
  },
} as const satisfies { [key: string]: Required<TagDefinition> }
