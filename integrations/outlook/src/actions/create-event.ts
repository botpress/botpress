import type { Implementation } from '../misc/types'

import { createEventInputSchema } from '../misc/custom-schemas'

import { getClient, createAttendees } from '../utils'

export const createEvent: Implementation['actions']['createEvent'] = async ({
  ctx,
  input,
}) => {
  const validatedInput = createEventInputSchema.parse(input)
  const graphClient = getClient(ctx.configuration)
  const body = {
    contentType: 'HTML',
    content: validatedInput.content,
  }
  const start = {
    dateTime: validatedInput.startDateTime,
    timeZone: validatedInput.startTimeZone,
  }
  const end = {
    dateTime: validatedInput.startDateTime,
    timeZone: validatedInput.startTimeZone,
  }
  const location = {
    displayName: validatedInput.location,
  }
  const event = {
    subject: validatedInput.subject,
    body,
    start,
    end,
    location,
    attendees: createAttendees(validatedInput),
  }
  const response = await graphClient.createEvent(event)
  return response
}
