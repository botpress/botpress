import { isApiError, RuntimeError } from '@botpress/sdk'
import { google } from 'googleapis'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { RequestMapping, ResponseMapping } from './mapping'
import { getAuthenticatedOAuth2Client } from './oauth-client'
import { CreateEventRequest, GoogleCalendarClient, GoogleOAuth2Client, Event, UpdateEventRequest } from './types'
import * as bp from '.botpress'

export class GoogleClient {
  private readonly _calendarClient: GoogleCalendarClient
  private readonly _calendarId: string

  private constructor({ calendarId, oauthClient }: { calendarId: string; oauthClient: GoogleOAuth2Client }) {
    this._calendarId = calendarId

    this._calendarClient = google.calendar({ version: 'v3', auth: oauthClient })
  }

  public static async create({ ctx, client }: { ctx: bp.Context; client: bp.Client }) {
    const oauth2Client = await getAuthenticatedOAuth2Client({ ctx, client })
    const calendarId = await this._resolveCalendarId({ ctx, client })

    return new GoogleClient({ oauthClient: oauth2Client, calendarId })
  }

  private static async _resolveCalendarId({ ctx, client }: { ctx: bp.Context; client: bp.Client }): Promise<string> {
    if (ctx.configurationType === 'serviceAccountKey') {
      return ctx.configuration.calendarId
    }

    const stateResult = await client
      .getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
      .catch((error: unknown) => {
        // Old installs configured before the wizard existed never wrote this state
        if (isApiError(error) && error.type === 'ResourceNotFound') {
          return null
        }
        throw error
      })

    const calendarId = stateResult?.state.payload.calendarId ?? ctx.configuration.calendarId
    if (typeof calendarId !== 'string' || calendarId.trim().length === 0) {
      throw new RuntimeError('Calendar ID is missing. Please reconfigure the integration.')
    }
    return calendarId
  }

  @handleErrors('Failed to get calendar summary')
  public async getCalendarSummary() {
    const { data } = await this._calendarClient.calendars.get({ calendarId: this._calendarId, fields: 'summary' })

    return data.summary ?? 'Untitled'
  }

  @handleErrors('Failed to create calendar event')
  public async createEvent({ event }: { event: CreateEventRequest }): Promise<Event> {
    const { data } = await this._calendarClient.events.insert({
      calendarId: this._calendarId,
      requestBody: RequestMapping.mapCreateEvent(event),
      conferenceDataVersion: event.enableGoogleMeet ? 1 : undefined,
      sendUpdates: event.sendNotifications !== false && event.attendees && event.attendees.length > 0 ? 'all' : 'none',
    })

    return ResponseMapping.mapEvent(data)
  }

  @handleErrors('Failed to update calendar event')
  public async updateEvent({ event }: { event: UpdateEventRequest }): Promise<Event> {
    const { data } = await this._calendarClient.events.update({
      calendarId: this._calendarId,
      eventId: event.id,
      requestBody: RequestMapping.mapUpdateEvent(event),
      conferenceDataVersion: event.enableGoogleMeet ? 1 : undefined,
      sendUpdates: event.sendNotifications !== false && event.attendees && event.attendees.length > 0 ? 'all' : 'none',
    })

    return ResponseMapping.mapEvent(data)
  }

  @handleErrors('Failed to delete calendar event')
  public async deleteEvent({ eventId }: { eventId: Event['id'] }): Promise<void> {
    await this._calendarClient.events.delete({
      calendarId: this._calendarId,
      eventId,
    })
  }

  @handleErrors('Failed to get calendar event')
  public async getEvent({ eventId }: { eventId: Event['id'] }): Promise<Event> {
    const { data } = await this._calendarClient.events.get({
      calendarId: this._calendarId,
      eventId,
    })

    return ResponseMapping.mapEvent(data)
  }

  @handleErrors('Failed to list calendar events')
  public async listEvents({
    fetchAmount,
    minDate,
    pageToken,
  }: {
    fetchAmount: number
    minDate: string
    pageToken?: string
  }) {
    const { data } = await this._calendarClient.events.list({
      calendarId: this._calendarId,
      maxResults: fetchAmount,
      timeMin: minDate,
      pageToken,
    })

    return {
      events: ResponseMapping.mapEvents(data.items),
      nextPageToken: ResponseMapping.mapNextToken(data.nextPageToken),
    }
  }

  @handleErrors('Failed to check calendar availability')
  public async getBusySlots({ timeMin, timeMax }: { timeMin: string; timeMax: string }) {
    const { data } = await this._calendarClient.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: this._calendarId }],
      },
    })

    const calendarBusy = data.calendars?.[this._calendarId]?.busy || []

    return {
      busySlots: calendarBusy.map((slot) => ({
        start: slot.start || '',
        end: slot.end || '',
      })),
    }
  }
}
