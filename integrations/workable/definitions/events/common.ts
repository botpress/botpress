import { z } from '@botpress/sdk'

export const webhookEvent = z.object({
  firedAt: z.string().title('Fired At').describe('The date and time the event was triggered'),
  id: z.string().title('Id').describe('The event identifier'),
  resourceType: z.string().title('Resource Type').describe('The type of the payload resource'),
})
