import type { createEventAction } from '../misc/types'

import {
  createEventInputSchema,
  createEventOutputSchema,
} from '../misc/custom-schemas'

import { getClient, createAttendees } from '../utils'

export const createEvent: createEventAction = async ({
  ctx,
  input,
  logger,
}) => {
  const validatedInput = createEventInputSchema.parse(input)
  let response
  try {
    const graphClient = getClient(ctx.configuration)
    const body = {
      contentType: 'HTML',
      content: validatedInput.content || '',
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
    response = await graphClient.createEvent({ ctx, ...event })
    logger
      .forBot()
      .info(
        `Successful - Create Event: ${validatedInput.subject} - from ${validatedInput.startDateTime} to ${validatedInput.endDateTime}`
      )
  } catch (error) {
    response = {}
    logger.forBot().debug(`'Create Event' exception ${JSON.stringify(error)}`)
  }

  return createEventOutputSchema.parse(response)
}
