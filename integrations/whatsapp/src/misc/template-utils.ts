import { z } from '@botpress/sdk'
import axios from 'axios'
import {
  Component,
  NamedVariables,
  PositionalVariables,
  TemplateButtons,
  TemplateHeader,
  TemplateVariables,
  templateButtonsSchema,
  templateHeaderSchema,
  templateVariablesSchema,
} from 'src/misc/types'
import {
  BodyComponent,
  BodyParameter,
  HeaderComponent,
  HeaderParameter,
  URLComponent,
  PayloadComponent,
  CopyComponent,
  SkipButtonComponent,
  Image,
  Document,
  Video,
  Location,
} from 'whatsapp-api-js/messages'
import type { TemplateComponent } from 'whatsapp-api-js/types'
import { getAccessToken, getWabaId } from '../auth'
import { WHATSAPP } from './constants'
import { hasAtleastOne, logForBotAndThrow } from './util'
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
      logForBotAndThrow(`Failed to fetch message templates: ${e.response?.data?.error?.message ?? e.message}`, logger)
    })

  const parsedResult = whatsAppTemplatesResponseSchema.safeParse(response.data)
  if (!parsedResult.success) {
    logForBotAndThrow(
      `Failed to parse response from WhatsApp API when fetching templates: ${parsedResult.error.message}`,
      logger
    )
  }

  return parsedResult.data
}

export function parseTemplateVariablesJSON(templateVariablesJson: string, logger: bp.Logger): TemplateVariables {
  let templateVariablesRaw: unknown

  try {
    templateVariablesRaw = JSON.parse(templateVariablesJson)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    logForBotAndThrow(
      `Value provided for Template Variables JSON isn't valid JSON (error: ${message}). Received: ${templateVariablesJson}`,
      logger
    )
  }

  const validationResult = templateVariablesSchema.safeParse(templateVariablesRaw)
  if (!validationResult.success) {
    logForBotAndThrow(
      `Template variables should be an array or an object of strings/numbers (error: ${validationResult.error})`,
      logger
    )
  }

  return validationResult.data
}

export function isNamedVariables(variables: TemplateVariables): variables is NamedVariables {
  return !Array.isArray(variables)
}

export const getTemplateText = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  templateName: string,
  templateLanguage: string,
  bodyVariables: TemplateVariables,
  headerInfo?: TemplateHeader
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

    return _getTemplateText((template.components ?? []) as Component[], bodyVariables, headerInfo)
  } catch (thrown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().debug(`failed to get template text - ${errMsg}`)
    return `Sent template "${templateName}" with language "${templateLanguage}"`
  }
}

const _getTemplateText = (
  templateComponents: Component[],
  bodyVariables: TemplateVariables,
  headerInfo?: TemplateHeader
) => {
  let templateText = ''
  for (const component of templateComponents) {
    const componentText = _parseComponent(component, bodyVariables, headerInfo)
    if (!componentText) {
      throw new Error('componentText is undefined')
    }
    templateText += componentText
  }
  return templateText
}

const _parseComponent = (
  component: Component,
  bodyVariables: TemplateVariables,
  headerInfo?: TemplateHeader
): string | undefined => {
  let compText
  switch (component.type) {
    case 'BODY':
      compText = component.text ?? 'body has no text'
      return `[BODY]\n${_getRenderedBodyText(compText, bodyVariables)}\n`
    case 'HEADER':
      if (headerInfo) {
        switch (headerInfo.type) {
          case 'text': {
            let headerText = headerInfo.text
            if (component.format === 'TEXT' && component.text) {
              headerText = component.text.replace(/\{\{[^}]+\}\}/, headerInfo.text)
            }
            return `[HEADER TEXT]\n${headerText}\n`
          }
          case 'image':
            return `[HEADER MEDIA IMAGE]\n${headerInfo.url}\n`
          case 'video':
            return `[HEADER MEDIA VIDEO]\n${headerInfo.url}\n`
          case 'document':
            return `[HEADER MEDIA DOCUMENT]\n${headerInfo.url}\n`
          case 'location':
            return `[HEADER LOCATION]\nlat: ${headerInfo.latitude} long: ${headerInfo.longitude} address: ${headerInfo.address} name: ${headerInfo.name}\n`
        }
      }
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

const _getRenderedBodyText = (text: string, bodyVariables: TemplateVariables): string => {
  if (Array.isArray(bodyVariables)) {
    bodyVariables.forEach((value, index) => {
      text = text.replace(`{{${index + 1}}}`, value.toString())
    })
  } else {
    for (const [key, value] of Object.entries(bodyVariables)) {
      text = text.replace(`{{${key}}}`, value.toString())
    }
  }

  return text
}

export function parseTemplateHeaderJSON(json: string, logger: bp.Logger): TemplateHeader {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    logForBotAndThrow(
      `Value provided for Template Header JSON isn't valid JSON (error: ${message}). Received: ${json}`,
      logger
    )
  }

  const result = templateHeaderSchema.safeParse(raw)
  if (!result.success) {
    logForBotAndThrow(
      `Invalid template header JSON (error: ${result.error.message})`,
      logger
    )
  }

  return result.data
}

export function parseTemplateButtonsJSON(json: string, logger: bp.Logger): TemplateButtons {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ''
    logForBotAndThrow(
      `Value provided for Template Buttons JSON isn't valid JSON (error: ${message}). Received: ${json}`,
      logger
    )
  }

  const result = templateButtonsSchema.safeParse(raw)
  if (!result.success) {
    logForBotAndThrow(
      `Invalid template buttons JSON (error: ${result.error.message})`,
      logger
    )
  }

  return result.data
}

/**
 * Custom body component that supports named parameter_name fields,
 * which the whatsapp-api-js library does not yet support.
 */
class NamedBodyComponent implements TemplateComponent {
  readonly type = 'body' as const
  readonly parameters: Array<{ type: 'text'; parameter_name: string; text: string }>

  constructor(namedVars: NamedVariables) {
    this.parameters = Object.entries(namedVars).map(([key, value]) => ({
      type: 'text' as const,
      parameter_name: key,
      text: value.toString(),
    }))
  }

  _build() {
    return this
  }
}

export function buildBodyComponent(variables: TemplateVariables): TemplateComponent | undefined {
  if (isNamedVariables(variables)) {
    if (Object.keys(variables).length === 0) {
      return undefined
    }
    return new NamedBodyComponent(variables)
  }

  const bodyParams: BodyParameter[] = variables.map((v) => new BodyParameter(v.toString()))
  if (hasAtleastOne(bodyParams)) {
    return new BodyComponent(...bodyParams)
  }
  return undefined
}

export function buildHeaderComponent(header: TemplateHeader): HeaderComponent {
  switch (header.type) {
    case 'text':
      return new HeaderComponent(new HeaderParameter(header.text))
    case 'image':
      return new HeaderComponent(new HeaderParameter(new Image(header.url)))
    case 'video':
      return new HeaderComponent(new HeaderParameter(new Video(header.url)))
    case 'document':
      return new HeaderComponent(new HeaderParameter(new Document(header.url, false, undefined, header.filename)))
    case 'location':
      return new HeaderComponent(
        new HeaderParameter(new Location(header.longitude, header.latitude, header.name, header.address))
      )
  }
}

export function buildButtonComponents(buttons: TemplateButtons): TemplateComponent[] {
  const result: TemplateComponent[] = []

  for (const button of buttons) {
    switch (button.type) {
      case 'url':
        result.push(new URLComponent(button.text))
        break
      case 'quick_reply':
        result.push(new PayloadComponent(button.payload))
        break
      case 'copy_code':
        result.push(new CopyComponent(button.code))
        break
      case 'skip':
        result.push(new SkipButtonComponent())
        break
    }
  }

  return result
}
