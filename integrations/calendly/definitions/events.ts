import { z } from '@botpress/sdk'
import { nonBlankString } from './common'

export const inviteeEventOutputSchema = z.object({
  eventName: nonBlankString.describe('The name of the scheduled event').title('Scheduled Event Name'),
  startTime: z.string().datetime().describe('The start time of the scheduled event').title('Start Time'),
  endTime: z.string().datetime().describe('The end time of the scheduled event').title('End Time'),
  locationType: nonBlankString
    .describe('The type of location for the scheduled event')
    .title("Location Type (e.g. 'zoom', 'google_conference', 'microsoft_teams_conference')"),
  organizerName: nonBlankString.describe('The name of the event organizer').title('Organizer Name'),
  organizerEmail: nonBlankString.email().describe('The email of the event organizer').title('Organizer Email'),
  inviteeName: nonBlankString.describe('The name of the invitee').title('Invitee Name'),
  inviteeEmail: nonBlankString.email().describe('The email of the invitee').title('Invitee Email'),
  conversationId: z
    .string()
    .nullable()
    .describe('The conversation ID associated with the event, if available')
    .title('Conversation ID'),
})
