import { z, ActionDefinition } from '@botpress/sdk'

// to make sure the duration is in the format "HH:MM"
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/
// to make sure the date is in the format "YYYY-MM-DD"
const ymd  = /^\d{4}-\d{2}-\d{2}$/ 

const participantSchema = z.object({
  person_id: z.number().int().describe('Linked person ID'),
  primary: z.boolean().optional().describe('Mark as primary participant'),
})

const attendeeSchema = z.object({
  email: z.string().email().optional().describe('Guest email (for calendar)'),
  name: z.string().optional().describe('Guest name (for calendar)'),
  status: z.enum(['needsAction','tentative','accepted','declined']).optional(),
  is_organizer: z.boolean().optional(),
  person_id: z.number().int().optional().describe('Linked person ID'),
  user_id: z.number().int().optional().describe('Linked user ID'),
})

export const createActivity: ActionDefinition = {
  title: 'Create Activity',
  description: 'Create an activity in Pipedrive',
  input: {
    schema: z.object({
        subject: z.string().optional().title('Subject').describe('The subject of the activity'),
        type: z.preprocess(
          v => (typeof v === 'string' ? v.toLowerCase() : v),
          z.enum(['call','meeting','task','deadline','email','lunch']).optional()
        ).title('Type').describe('Activity type (Call, Meeting, Task, Deadline, Email, Lunch)'),
        user_id: z.number().int().optional().title('User ID').describe('The ID of the user the activity is associated with'),
        deal_id: z.number().int().optional().title('Deal ID').describe('The ID of the deal the activity is associated with'),
        lead_id: z.string().uuid().optional().title('Lead ID').describe('The ID of the lead the activity is associated with'),
        person_id: z.number().int().optional().title('Person ID').describe('The ID of the person the activity is associated with'),
        project_id: z.number().int().optional().title('Project ID').describe('The ID of the project the activity is associated with'),
        org_id: z.number().int().optional().title('Organization ID').describe('The ID of the organization the activity is associated with'),
        due_date: z.string().regex(ymd).optional()
            .title('Due Date')
            .describe('YYYY-MM-DD (date the activity occurs)'),
        due_time: z.string().regex(hhmm).optional()
            .title('Due Time (UTC)')
            .describe('HH:MM in UTC (e.g., 15:10 = 3:10 PM UTC)'),
        duration: z.string().regex(hhmm).optional()
            .title('Duration (HH:MM)')
            .describe('Length of the activity; use HH:MM (e.g., 00:10 for 10 minutes)'),
        location: z.string().optional().title('Location')
            .describe('e.g., "Online" or free-form address text'),
        location_details: z.object({
            country: z.string().optional(),
            admin_area_level_1: z.string().optional(),
            admin_area_level_2: z.string().optional(),
            locality: z.string().optional(),
            sublocality: z.string().optional(),
            route: z.string().optional(),
            street_number: z.string().optional(),
            postal_code: z.string().optional(),
        }).optional().title('Location details')
          .describe('Optional structured address parts (expand to edit)'),
        public_description: z.string().optional().title('Public Description').describe('The public description of the activity'),
        note: z.string().optional().title('Note').describe('The note of the activity'),
        busy_flag: z.boolean().optional().title('Busy').describe('The busy flag of the activity'),
        participants: z.array(participantSchema).optional().title('Participants')
            .describe('Additional linked persons (besides person_id)'),
        attendees: z.array(attendeeSchema).optional().title('Attendees')
            .describe('Calendar attendees (email/name/status, etc.)'),
    }),
  },
  output: {
    schema: z.object({
      activity: z.unknown().title('Activity')
        .describe('The activity returned by Pipedrive'),
    }),
  },
}

const updateActivity: ActionDefinition = {
    title: 'Update Activity',
    description: 'Update an activity in Pipedrive',
    input: {
        schema: z.object({
            activity_id: z.number().int().title('Activity ID')
            .describe('The ID of the activity to update'),
            subject: z.string().optional().title('Subject').describe('The subject of the activity'),
            type: z.preprocess(
              v => (typeof v === 'string' ? v.toLowerCase() : v),
              z.enum(['call','meeting','task','deadline','email','lunch']).optional()
            ).title('Type').describe('Activity type (Call, Meeting, Task, Deadline, Email, Lunch)'),
            user_id: z.number().int().optional().title('User ID').describe('The ID of the user the activity is associated with'),
            deal_id: z.number().int().optional().title('Deal ID').describe('The ID of the deal the activity is associated with'),
            lead_id: z.string().uuid().optional().title('Lead ID').describe('The ID of the lead the activity is associated with'),
            person_id: z.number().int().optional().title('Person ID').describe('The ID of the person the activity is associated with'),
            project_id: z.number().int().optional().title('Project ID').describe('The ID of the project the activity is associated with'),
            org_id: z.number().int().optional().title('Organization ID').describe('The ID of the organization the activity is associated with'),
            due_date: z.string().regex(ymd).optional()
                .title('Due Date')
                .describe('YYYY-MM-DD (date the activity occurs)'),
            due_time: z.string().regex(hhmm).optional()
                .title('Due Time (UTC)')
                .describe('HH:MM in UTC (e.g., 15:10 = 3:10 PM UTC)'),
            duration: z.string().regex(hhmm).optional()
                .title('Duration (HH:MM)')
                .describe('Length of the activity; use HH:MM (e.g., 00:10 for 10 minutes)'),
            location: z.string().optional().title('Location')
                .describe('e.g., "Online" or free-form address text'),
            location_details: z.object({
                country: z.string().optional(),
                admin_area_level_1: z.string().optional(),
                admin_area_level_2: z.string().optional(),
                locality: z.string().optional(),
                sublocality: z.string().optional(),
                route: z.string().optional(),
                street_number: z.string().optional(),
                postal_code: z.string().optional(),
            }).optional().title('Location details')
              .describe('Optional structured address parts (expand to edit)'),
            public_description: z.string().optional().title('Public Description').describe('The public description of the activity'),
            note: z.string().optional().title('Note').describe('The note of the activity'),
            busy_flag: z.boolean().optional().title('Busy').describe('The busy flag of the activity'),
            participants: z.array(participantSchema).optional().title('Participants')
                .describe('Additional linked persons (besides person_id)'),
            attendees: z.array(attendeeSchema).optional().title('Attendees')
                .describe('Calendar attendees (email/name/status, etc.)'),
        }),
    },
    output: {
      schema: z.object({
        activity: z.unknown().title('Activity')
          .describe('The activity returned by Pipedrive'),
      }),
    },
  }
  

export const actions = {
  createActivity,
  updateActivity
} as const