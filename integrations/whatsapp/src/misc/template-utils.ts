import axios from 'axios'
import { Component, TemplateVariables, templateVariablesSchema } from 'src/misc/types'
import { getAccessToken, getWabaId } from '../auth'
import { logForBotAndThrow } from './util'
import * as bp from '.botpress'

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
    const waba_id = await getWabaId(client, ctx).catch(() => {
      throw new Error("The configuration doesn't support having the full template in the Botpress' conversation: ")
    })

    const accessToken = await getAccessToken(client, ctx).catch((e) => {
      throw new Error('Failed to get access token - error:', e.response?.data || e.message || e)
    })

    const url = `https://graph.facebook.com/v20.0/${waba_id}/message_templates?name=${templateName}&language=${templateLanguage}`
    const templateComponents: Component[] = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        if (!res.data.data[0]) {
          throw new Error('No template received')
        }
        return res.data.data[0].components
      })
      .catch((e) => {
        throw new Error('Failed to fetch template components', e.response?.data || e.message || e)
      })

    return _getTemplateText(templateComponents, bodyVariables)
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
