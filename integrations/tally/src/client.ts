import { string, z } from '@botpress/sdk'
import { listSubmissionsInputSchema, listSubmissionsOuputSchema } from 'schemas/tally-submissions'

export type CreateWebhookReq = {
  formId: string
  url: string
  eventTypes: Array<'FORM_RESPONSE'>
  signingSecret?: string
  httpHeaders?: Array<{ name: string; value: string }>
  externalSubscriber?: string
}

const createWebhookResSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  eventTypes: z.array(z.literal('FORM_RESPONSE')),
  isEnabled: z.boolean(),
  createdAt: z.string(),
})

export type CreateWebhookRes = z.infer<typeof createWebhookResSchema>
export type listSubmissionsRes = z.infer<typeof listSubmissionsOuputSchema>

const TALLY_BASE_URL = 'https://api.tally.so'

export class TallyApi {
  constructor(private apiKey: string) {}

  async createWebhook(body: CreateWebhookReq): Promise<CreateWebhookRes> {
    const res = await fetch(`${TALLY_BASE_URL}/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Tally createWebhook failed (${res.status} ${res.statusText})`)
    }

    const json = await res.json()
    return createWebhookResSchema.parse(json)
  }

  async deleteWebhook(tallyWebhookId: string): Promise<void> {
    const res = await fetch(`${TALLY_BASE_URL}/webhooks/${tallyWebhookId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiKey}` },
    })

    if (!res.ok) {
      throw new Error(`Tally deleteWebhook failed (${res.status} ${res.statusText})`)
    }
  }

  async listSubmissions(input: z.infer<typeof listSubmissionsInputSchema>): Promise<listSubmissionsRes> {
    const { formId, ...params } = input
    const qs = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue
      qs.set(key, String(value))
    }

    const url = `${TALLY_BASE_URL}/forms/${formId}/submissions?${qs.toString()}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!res.ok) {
      throw new Error(`Tally listSubmissions failed (${res.status} ${res.statusText})`)
    }

    const json = await res.json()
    return listSubmissionsOuputSchema.parse(json)
  }
}
