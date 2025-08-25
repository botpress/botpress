import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'

const TEMP_EVENT_TYPE_ID = 3096892 // Replace with your actual event type ID

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

export class CalcomApi {
  private baseUrl = 'https://api.cal.com/v2'

  constructor(
    readonly apiKey: string,
    private logger: IntegrationLogger
  ) {
    if (!apiKey || !apiKey.startsWith('cal_')) {
      throw new Error('Invalid API Key format. It should start with "cal_".')
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`
  }

  async generateLink(email: string): Promise<string> {
    const slug = (await this.getEventType())?.slug

    // date time string in 24hours
    const now = new Date()
    now.setHours(now.getHours() + 24)
    const expirationTime = now.toISOString()

    const resp = await axios
      .post(`${this.baseUrl}/event-types/${TEMP_EVENT_TYPE_ID}/private-links`, {
        expiresAt: expirationTime,
      })
      .catch((err) => {
        this.logger.error('calcom::generateLink error', err.response?.data || err.message)
        throw new Error('Failed to generate link. Please check the logs for more details.')
      })

    return `${resp.data?.data?.bookingUrl}/${slug}?email=${email}`
  }

  async getEventType() {
    const resp = await axios.get(`${this.baseUrl}/event-types/${TEMP_EVENT_TYPE_ID}`)
    if (resp?.data) {
      return resp.data.data?.eventType
    }

    return null
  }

  async getAllEventTypes(username?: string) {
    const resp = await axios
      .get(`${this.baseUrl}/event-types`, {
        params: {
          username,
        },
        headers: {
          'cal-api-version': '2024-06-14',
        },
      })
      .catch((err) => {
        this.logger.error('calcom::getAllEventTypes error', err.response?.data || err.message)
        throw new Error('Failed to fetch event types. Please check the logs for more details.')
      })

    return resp?.data?.data || []
  }

  async getAvailableTimeSlots(eventTypeId: number, startDate: Date, endDate: Date) {
    const resp = await axios
      .get(`${this.baseUrl}/slots`, {
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
        this.logger.error('calcom::getAvailableTimeSlots error', err.response?.data || err.message)
        throw new Error('Failed to fetch available time slots. Please check the logs for more details.')
      })

    return resp?.data?.data || []
  }

  async bookEvent(eventTypeId: number, startTime: string, email: string, name: string, timeZone: string) {
    const resp = await axios
      .post(
        `${this.baseUrl}/bookings`,
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
        this.logger.error('calcom::bookEvent error', JSON.stringify(err))
        throw new Error('Failed to book event. Please check the logs for more details.')
      })

    return resp?.data?.status === 'success'
  }
}
