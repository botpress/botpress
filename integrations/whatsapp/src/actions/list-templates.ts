import axios from 'axios'
import { getAccessToken, getWabaId } from '../auth'
import { WHATSAPP } from '../misc/constants'
import { logForBotAndThrow } from '../misc/util'
import * as bp from '.botpress'

type WhatsAppButton = {
  type: string
  text?: string
  url?: string
  phone_number?: string
}

type WhatsAppComponent = {
  type: string
  format?: string
  text?: string
  buttons?: WhatsAppButton[]
  example?: Record<string, unknown>
}

type WhatsAppTemplate = {
  id: string
  name: string
  status: string
  category: string
  language: string
  components?: WhatsAppComponent[]
}

type WhatsAppTemplatesResponse = {
  data: WhatsAppTemplate[]
  paging?: {
    cursors?: {
      after?: string
    }
  }
}

export const listTemplates: bp.IntegrationProps['actions']['listTemplates'] = async ({ ctx, input, client, logger }) => {
  if (ctx.configurationType === 'sandbox') {
    logForBotAndThrow('Listing templates is not supported in sandbox mode', logger)
  }

  const accessToken = await getAccessToken(client, ctx)
  const wabaId = await getWabaId(client, ctx)

  const params = new URLSearchParams({
    fields: 'id,name,status,category,language,components',
    limit: String(Math.min(input.limit ?? 20, 100)),
  })

  if (input.status) {
    params.append('status', input.status)
  }
  if (input.name) {
    params.append('name', input.name)
  }
  if (input.nextCursor) {
    params.append('after', input.nextCursor)
  }

  const url = `${WHATSAPP.API_URL}/${wabaId}/message_templates?${params.toString()}`

  const response = await axios
    .get<WhatsAppTemplatesResponse>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .catch((e) => {
      logForBotAndThrow(
        `Failed to fetch message templates: ${e.response?.data?.error?.message ?? e.message}`,
        logger
      )
    })

  const templates = (response.data.data ?? []).map((template) => ({
    id: template.id,
    name: template.name,
    status: template.status,
    category: template.category,
    language: template.language,
    components: (template.components ?? []).map((comp) => ({
      type: comp.type,
      format: comp.format,
      text: comp.text,
      buttons: comp.buttons?.map((btn) => ({
        type: btn.type,
        text: btn.text,
        url: btn.url,
        phone_number: btn.phone_number,
      })),
      example: comp.example,
    })),
  }))

  const nextCursor: string | undefined = response.data.paging?.cursors?.after

  return {
    templates,
    nextCursor,
  }
}
