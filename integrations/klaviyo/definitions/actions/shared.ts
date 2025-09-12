import { z } from '@botpress/sdk'
import { E164_REGEX } from './regex'

export const profileSchema = z.object({
  id: z.string().title('Profile ID').describe('The unique (Klaviyo) identifier of the profile'),
  email: z.string().email().title('Email address').describe('The email of the profile').optional(),
  phone: z.string().regex(E164_REGEX).title('Phone').describe('The phone number of the profile').optional(),
  firstName: z.string().title('First Name').describe('The first name of the profile').optional(),
  lastName: z.string().title('Last Name').describe('The last name of the profile').optional(),
})
