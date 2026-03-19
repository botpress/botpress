import { z } from '@botpress/sdk'
import axios from 'axios'
import { Component, TemplateVariables, templateVariablesSchema } from 'src/misc/types'
import { getAccessToken, getWabaId } from '../auth'
import { WHATSAPP } from './constants'
import { logForBotAndThrow } from './util'
import * as bp from '.botpress'

const whatsAppButtonSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  url: z.string().optional(),
  phone_number: z.string().optional(),
})

const whatsAppComponentSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  text: z.string().optional(),
  buttons: z.array(whatsAppButtonSchema).optional(),
  example: z.record(z.unknown()).optional(),
})

const whatsAppTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  category: z.string(),
  language: z.string(),
  components: z.array(whatsAppComponentSchema).optional(),
})

const whatsAppTemplatesResponseSchema = z.object({
  data: z.array(whatsAppTemplateSchema),
  paging: z
    .object({
      cursors: z
        .object({
          after: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
})

const fetchTemplatesParamsSchema = z.object({
  name: z.string().optional(),
  language: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().optional(),
  after: z.string().optional(),
  fields: z.string().optional(),
})

export type WhatsAppButton = z.infer<typeof whatsAppButtonSchema>
export type WhatsAppComponent = z.infer<typeof whatsAppComponentSchema>
export type WhatsAppTemplate = z.infer<typeof whatsAppTemplateSchema>
export type WhatsAppTemplatesResponse = z.infer<typeof whatsAppTemplatesResponseSchema>
export type FetchTemplatesParams = z.infer<typeof fetchTemplatesParamsSchema>

export const fetchTemplates = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  params: FetchTemplatesParams = {}
): Promise<WhatsAppTemplatesResponse> => {
  const accessToken = await getAccessToken(client, ctx)
  const wabaId = await getWabaId(client, ctx)

  const queryParams = new URLSearchParams()

  if (params.fields) {
    queryParams.append('fields', params.fields)
  }
  if (params.name) {
    queryParams.append('name', params.name)
  }
  if (params.language) {
    queryParams.append('language', params.language)
  }
  if (params.status) {
    queryParams.append('status', params.status)
  }
  if (params.limit) {
    queryParams.append('limit', String(params.limit))
  }
  if (params.after) {
    queryParams.append('after', params.after)
  }

  const url = `${WHATSAPP.API_URL}/${wabaId}/message_templates?${queryParams.toString()}`

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

  return response.data
}

export function parseTemplateVariablesJSON(templateVariablesJson: string, logger: bp.Logger): TemplateVariables {
  let templateVariablesRaw = []

  try {
    templateVariablesRaw = JSON.parse(templateVariablesJson)
  } catch (err: any) {
    logForBotAndThrow(
      `Value provided for Template Variables JSON isn't valid JSON (error: ${
        err?.message ?? ''
      }). Received: ${templateVariablesJson}`,
      logger
    )
  }

  const validationResult = templateVariablesSchema.safeParse(templateVariablesRaw)
  if (!validationResult.success) {
    logForBotAndThrow(
      `Template variables should be an array of strings or numbers (error: ${validationResult.error})`,
      logger
    )
  }

  return validationResult.data
}

export const getTemplateText = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  templateName: string,
  templateLanguage: string,
  bodyVariables: TemplateVariables
): Promise<string> => {
  try {
    const response = await fetchTemplates(ctx, client, logger, {
      name: templateName,
      language: templateLanguage,
    })

    const template = response.data[0]
    if (!template) {
      throw new Error('No template received')
    }

    return _getTemplateText(template.components as Component[], bodyVariables)
  } catch (thrown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().debug(`failed to get template text - ${errMsg}`)
    return `Sent template "${templateName}" with language "${templateLanguage}"`
  }
}

const _getTemplateText = (templateComponents: Component[], bodyVariables: TemplateVariables) => {
  let templateText = ''
  for (const component of templateComponents) {
    const componentText = _parseComponent(component, bodyVariables)
    if (!componentText) {
      throw new Error('componentText is undefined')
    }
    templateText += componentText
  }
  return templateText
}

const _parseComponent = (component: Component, bodyVariables: TemplateVariables): string | undefined => {
  let compText
  switch (component.type) {
    case 'BODY':
      compText = component.text ?? 'body has no text'
      return `[BODY]\n${_getRenderedbodyText(compText, bodyVariables)}\n`
    case 'HEADER':
      if (!component.format) {
        compText = component.parameters.flatMap((parameter) => {
          return `lat: ${parameter.location.latitude} long: ${parameter.location.longitude} address: ${parameter.location.address} name: ${parameter.location.name}\n`
        })
        return `[HEADER LOCATION]\n${compText}`
      } else if (component.format === 'TEXT') {
        compText = component.text ?? 'header has no text'
        return `[HEADER TEXT]\n${component.text}\n`
      } else {
        compText = component.example.header_handle.flatMap((url) => `${url}\n`)
        return `[HEADER MEDIA ${component.format}]\n${compText}\n`
      }
    case 'BUTTONS':
      compText = component.buttons.flatMap((button, index) => {
        if (!button.text) {
          return
        }
        return `button #${index + 1}: ${button.text}\n`
      })
      return `[buttons]\n${compText}`
    case 'FOOTER':
      compText = component.text ?? 'footer has no text'
      return `[FOOTER]\n${compText}\n`
    case 'FLOW':
      compText = component.text ?? 'flow has no text'
      return `[FLOW]\n${compText}\n`
    case 'QUICK_REPLY':
      compText = component.text ?? 'quick reply has no text'
      return `[QUICK_REPLY]\n${compText}\n`
    case 'PHONE_NUMBER':
      compText = component.text ?? 'phone number has no text'
      return `[PHONE_NUMBER]\n${compText}\n`
    case 'URL':
      compText = component.text ?? 'url has no text'
      return `[URL]\n${compText}\n`
    default:
      return undefined
  }
}

const _getRenderedbodyText = (text: string, bodyVariables: TemplateVariables): string => {
  bodyVariables.forEach((value, index) => {
    text = text.replace(`{{${index + 1}}}`, value.toString())
  })

  return text
}
