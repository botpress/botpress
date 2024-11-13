import { google } from 'googleapis'
import { handleErrorsDecorator as handleErrors } from './error-handling'
import { RequestMapping, ResponseMapping } from './mapping'
import { exchangeAuthCodeAndSaveRefreshToken, getAuthenticatedOAuth2Client } from './oauth-client'
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

    return new GoogleClient({
      oauthClient: oauth2Client,
      calendarId: ctx.configuration.calendarId,
    })
  }

  public static async authenticateWithAuthorizationCode({
    ctx,
    client,
    authorizationCode,
  }: {
    ctx: bp.Context
    client: bp.Client
    authorizationCode: string
  }) {
    await exchangeAuthCodeAndSaveRefreshToken({ ctx, client, authorizationCode })
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
    })

    return ResponseMapping.mapEvent(data)
  }

  @handleErrors('Failed to update calendar event')
  public async updateEvent({ event }: { event: UpdateEventRequest }): Promise<Event> {
    const { data } = await this._calendarClient.events.update({
      calendarId: this._calendarId,
      eventId: event.id,
      requestBody: RequestMapping.mapUpdateEvent(event),
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
}
