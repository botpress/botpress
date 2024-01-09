import { JWT } from 'google-auth-library'
import { google, calendar_v3 } from 'googleapis'
import { Config } from './misc/types'

export function getClient(config: Config) {
  return new GoogleCalendarApi(config.calendarId, config.privateKey, config.clientEmail)
}

export class GoogleCalendarApi {
  private calendar: calendar_v3.Calendar
  private calendarId: string

  constructor(calendarId: string, privateKey: string, clientEmail: string) {
    this.calendarId = calendarId

    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })

    this.calendar = google.calendar({ version: 'v3', auth: jwtClient })
  }

  async listEvents(): Promise<calendar_v3.Schema$Event[]> {
    const response = await this.calendar.events.list({
      calendarId: this.calendarId,
    })
    return response.data.items || []
  }

  async createEvent(event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const response = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
    })
    return response.data
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId: this.calendarId,
      eventId,
    })
  }
}
