import { z, EventDefinition } from '@botpress/sdk'

const profileCreated = {
  title: 'Profile Created',
  description: 'A profile has been created in Klaviyo',
  schema: z.object({
    email: z.string().email().title('Email address').describe('The email of the profile').optional(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format (e.g. +15005550006)')
      .title('Phone number')
      .describe('The phone number of the profile (E.164 format)')
      .optional(),
  }),
}
