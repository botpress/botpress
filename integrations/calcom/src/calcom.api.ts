import { IntegrationLogger } from '@botpress/sdk'
import axios, { type AxiosInstance } from 'axios'

export type CalcomEventType = {
  id: number
  lengthInMinutes: number
  title: string
  slug: string
  description: string
  locations: { type: string; address: string; public: boolean }[]
  hidden: boolean
  lengthInMinutesOptions?: number[]
}

const CALCOM_API_BASE_URL = 'https://api.cal.com/v2'

export class CalcomApi {
  private _axios: AxiosInstance

  public constructor(
    apiKey: string,
    private _logger: IntegrationLogger
  ) {
    if (!apiKey || !apiKey.startsWith('cal_')) {
      throw new Error('Invalid API Key format. It should start with "cal_".')
    }

    this._axios = axios.create({
      baseURL: CALCOM_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  public async generateLink(email: string, eventTypeId: number): Promise<string> {
    const slug = (await this.getEventType(eventTypeId))?.slug

    // date time string in 24hours
    const now = new Date()
    now.setHours(now.getHours() + 24)
    const expirationTime = now.toISOString()

    const resp = await this._axios
      .post(`/event-types/${eventTypeId}/private-links`, {
        expiresAt: expirationTime,
      })
      .catch((err) => {
        this._logger.error('calcom::generateLink error', err.response?.data || err.message)
        throw new Error('Failed to generate link. Please check the logs for more details.')
      })

    return `${resp.data?.data?.bookingUrl}/${slug}?email=${email}`
  }

  public async getEventType(eventTypeId: number): Promise<CalcomEventType | null> {
    const resp = await this._axios.get(`/event-types/${eventTypeId}`)
    if (resp?.data) {
      return resp.data.data?.eventType
    }

    return null
  }

  public async getAllEventTypes(username?: string): Promise<CalcomEventType[]> {
    const resp = await this._axios
      .get('/event-types', {
        params: {
          username,
        },
        headers: {
          'cal-api-version': '2024-06-14',
        },
      })
      .catch((err) => {
        this._logger.error('calcom::getAllEventTypes error', err.response?.data || err.message)
        throw new Error('Failed to fetch event types. Please check the logs for more details.')
      })

    return resp?.data?.data.filter((et: CalcomEventType) => !et.hidden) || []
  }

  public async getAvailableTimeSlots(eventTypeId: number, startDate: Date, endDate: Date) {
    const resp = await this._axios
      .get('/slots', {
        params: {
          eventTypeId,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        headers: {
          'cal-api-version': '2024-09-04',
        },
      })
      .catch((err) => {
        this._logger.error('calcom::getAvailableTimeSlots error', err.response?.data || err.message)
        throw new Error('Failed to fetch available time slots. Please check the logs for more details.')
      })

    return resp?.data?.data || []
  }

  public async bookEvent(eventTypeId: number, startTime: string, email: string, name: string, timeZone: string) {
    const resp = await this._axios
      .post(
        '/bookings',
        {
          eventTypeId,
          start: startTime,
          attendee: {
            email,
            name,
            timeZone,
          },
        },
        {
          headers: {
            'cal-api-version': '2024-08-13',
          },
        }
      )
      .catch((err) => {
        this._logger.error('calcom::bookEvent error', JSON.stringify(err))
        throw new Error('Failed to book event. Please check the logs for more details.')
      })

    return resp?.data?.status === 'success'
  }
}
