import { IntegrationLogger } from '@botpress/sdk'
import axios from 'axios'

const TEMP_EVENT_TYPE_ID = 3096892 // Replace with your actual event type ID

export class CalcomApi {
  private baseUrl = 'https://api.cal.com/v2'

  constructor(
    private readonly apiKey: string,
    private logger: IntegrationLogger
  ) {
    if (!apiKey || !apiKey.startsWith('cal_')) {
      throw new Error('Invalid API Key format. It should start with "cal_".')
    }

    axios.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`
  }

  async generateLink(): Promise<string> {
    const slug = (await this.getEventType())?.slug

    // date time string in 24hours
    const now = new Date()
    now.setHours(now.getHours() + 24)
    const expirationTime = now.toISOString()

    const resp = await axios
      .post(`${this.baseUrl}/event-types/${TEMP_EVENT_TYPE_ID}/private-links`, { expiresAt: expirationTime })
      .catch((err) => {
        this.logger.error('calcom::generateLink error', err.response?.data || err.message)
        throw new Error('Failed to generate link. Please check the logs for more details.')
      })

    return `${resp.data?.data?.bookingUrl}/${slug}?email=paul.chevilley@test.com`
  }

  async getEventType() {
    const resp = await axios.get(`${this.baseUrl}/event-types/${TEMP_EVENT_TYPE_ID}`)
    if (resp?.data) {
      return resp.data.data?.eventType
    }
    return null
  }
}
