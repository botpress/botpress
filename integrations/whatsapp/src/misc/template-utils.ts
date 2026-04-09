import { z } from '@botpress/sdk'
import axios from 'axios'
import {
  Component,
  KeyValuePair,
  NamedVariables,
  TemplateBodyParams,
  TemplateButtonParam,
  TemplateHeaderParam,
  TemplateVariables,
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

// TODO: Remove in the next major
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

function isNamedVariables(variables: TemplateVariables): variables is NamedVariables {
  return !Array.isArray(variables)
}

function headerParamToKVPairs(param: TemplateHeaderParam | undefined): KeyValuePair[] {
  if (!param) {
    return []
  }
  switch (param.type) {
    case 'text':
      return [{ key: param.parameterName ?? '1', value: param.value }]
    case 'image':
      return [{ key: 'image', value: param.url }]
    case 'video':
      return [{ key: 'video', value: param.url }]
    case 'document':
      return [{ key: param.filename ? `document:${param.filename}` : 'document', value: param.url }]
  }
}

function bodyParamsToKVPairs(params: TemplateBodyParams | undefined): KeyValuePair[] {
  if (!params) {
    return []
  }
  switch (params.type) {
    case 'positional':
      return params.values.map((v, i) => ({ key: String(i + 1), value: v }))
    case 'named':
      return Object.entries(params.values).map(([key, value]) => ({ key, value }))
  }
}

export const generateSyntheticTemplateText = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  templateName: string,
  templateLanguage: string,
  bodyParams: TemplateBodyParams | undefined,
  headerParam: TemplateHeaderParam | undefined
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

    const bodyKV = bodyParamsToKVPairs(bodyParams)
    const headerKV = headerParamToKVPairs(headerParam)
    return _getTemplateText((template.components ?? []) as Component[], bodyKV, headerKV)
  } catch (thrown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().debug(`failed to get template text - ${errMsg}`)
    return `Sent template "${templateName}" with language "${templateLanguage}"`
  }
}

const _getTemplateText = (
  templateComponents: Component[],
  bodyParams: KeyValuePair[],
  headerParams: KeyValuePair[]
) => {
  let templateText = ''
  for (const component of templateComponents) {
    const componentText = _parseComponent(component, bodyParams, headerParams)
    if (!componentText) {
      throw new Error('componentText is undefined')
    }
    templateText += componentText
  }
  return templateText
}

const _parseComponent = (
  component: Component,
  bodyParams: KeyValuePair[],
  headerParams: KeyValuePair[]
): string | undefined => {
  let compText
  switch (component.type) {
    case 'BODY':
      compText = component.text ?? 'body has no text'
      return `[BODY]\n${_getRenderedBodyText(compText, bodyParams)}\n`
    case 'HEADER':
      if (headerParams.length > 0) {
        const first = headerParams[0]!
        const baseKey = first.key.split(':')[0]!
        if (baseKey === 'image') {
          return `[HEADER MEDIA IMAGE]\n${first.value}\n`
        }
        if (baseKey === 'video') {
          return `[HEADER MEDIA VIDEO]\n${first.value}\n`
        }
        if (baseKey === 'document') {
          return `[HEADER MEDIA DOCUMENT]\n${first.value}\n`
        }
        // Text header
        let headerText = first.value
        if (component.format === 'TEXT' && component.text) {
          headerText = component.text.replace(/\{\{[^}]+\}\}/, first.value)
        }
        return `[HEADER TEXT]\n${headerText}\n`
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
        compText = component.example.header_handle.flatMap((url: string) => `${url}\n`)
        return `[HEADER MEDIA ${component.format}]\n${compText}\n`
      }
    case 'BUTTONS':
      compText = component.buttons.flatMap((button: { text?: string }, index: number) => {
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

const _getRenderedBodyText = (text: string, bodyParams: KeyValuePair[]): string => {
  for (const { key, value } of bodyParams) {
    text = text.replace(`{{${key}}}`, value)
  }
  return text
}

/**
 * Custom body component that supports named parameter_name fields,
 * which the whatsapp-api-js library does not yet support.
 */
class NamedBodyComponent implements TemplateComponent {
  public readonly type = 'body' as const
  public readonly parameters: Array<{ type: 'text'; parameter_name: string; text: string }>

  public constructor(namedValues: Record<string, string>) {
    this.parameters = Object.entries(namedValues).map(([key, value]) => ({
      type: 'text' as const,
      parameter_name: key,
      text: value,
    }))
  }

  public _build() {
    return this
  }
}

/**
 * Custom header component that supports the named parameter_name field,
 * which the whatsapp-api-js library does not yet support.
 */
class NamedHeaderComponent implements TemplateComponent {
  public readonly type = 'header' as const
  public readonly parameters: Array<{ type: 'text'; parameter_name: string; text: string }>

  public constructor(parameterName: string, value: string) {
    this.parameters = [
      {
        type: 'text' as const,
        parameter_name: parameterName,
        text: value,
      },
    ]
  }

  public _build() {
    return this
  }
}

export function buildHeaderComponent(param: TemplateHeaderParam): TemplateComponent {
  switch (param.type) {
    case 'image':
      return new HeaderComponent(new HeaderParameter(new Image(param.url)))
    case 'video':
      return new HeaderComponent(new HeaderParameter(new Video(param.url)))
    case 'document':
      return new HeaderComponent(new HeaderParameter(new Document(param.url, false, undefined, param.filename)))
    case 'text':
      if (param.parameterName) {
        return new NamedHeaderComponent(param.parameterName, param.value)
      }
      return new HeaderComponent(new HeaderParameter(param.value))
  }
}

export function buildBodyComponent(params: TemplateBodyParams): TemplateComponent | undefined {
  switch (params.type) {
    case 'positional': {
      if (params.values.length === 0) {
        return undefined
      }
      const bodyParams = params.values.map((v) => new BodyParameter(v))
      if (hasAtleastOne(bodyParams)) {
        return new BodyComponent(...bodyParams)
      }
      return undefined
    }
    case 'named': {
      if (Object.keys(params.values).length === 0) {
        return undefined
      }
      return new NamedBodyComponent(params.values)
    }
  }
}

export function buildBodyComponentFromLegacy(variables: TemplateVariables): TemplateComponent | undefined {
  if (isNamedVariables(variables)) {
    if (Object.keys(variables).length === 0) {
      return undefined
    }
    const stringValues: Record<string, string> = {}
    for (const [key, value] of Object.entries(variables)) {
      stringValues[key] = value.toString()
    }
    return new NamedBodyComponent(stringValues)
  }

  const bodyParams: BodyParameter[] = variables.map((v) => new BodyParameter(v.toString()))
  if (hasAtleastOne(bodyParams)) {
    return new BodyComponent(...bodyParams)
  }
  return undefined
}

export function buildButtonComponents(params: TemplateButtonParam[]): TemplateComponent[] {
  return params.flatMap((param): TemplateComponent[] => {
    switch (param.type) {
      case 'url':
        return [new URLComponent(param.value)]
      case 'quick_reply':
        return [new PayloadComponent(param.payload)]
      case 'copy_code':
        return [new CopyComponent(param.code)]
      case 'skip':
        return [new SkipButtonComponent()]
    }
  })
}
