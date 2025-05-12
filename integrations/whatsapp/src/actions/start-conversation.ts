import { RuntimeError, z } from '@botpress/sdk'
import { hasAtleastOne } from 'src/misc/util'
import { BodyComponent, BodyParameter, Language, Template } from 'whatsapp-api-js/messages'
import { getDefaultBotPhoneNumberId, getAuthenticatedWhatsappClient } from '../auth'
import * as bp from '.botpress'

const TemplateVariablesSchema = z.array(z.string().or(z.number()))

export const startConversation: bp.IntegrationProps['actions']['startConversation'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  // Prevent the use of billable resources through the sandbox account
  if (ctx.configurationType === 'sandbox') {
    _logForBotAndThrow('Starting a conversation is not supported in sandbox mode', logger)
  }

  const { userPhone, templateName, templateVariablesJson } = input.conversation
  const botPhoneNumberId = input.conversation.botPhoneNumberId
    ? input.conversation.botPhoneNumberId
    : await getDefaultBotPhoneNumberId(client, ctx).catch(() => {
        _logForBotAndThrow('No default bot phone number ID available', logger)
      })

  const templateLanguage = input.conversation.templateLanguage || 'en'
  let templateVariables: z.infer<typeof TemplateVariablesSchema> = []
  if (templateVariablesJson) {
    templateVariables = _parseTemplateVariablesJSON(templateVariablesJson, logger)
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      botPhoneNumberId,
      userPhone,
    },
  })

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const language = new Language(templateLanguage)
  const bodyParams: BodyParameter[] = templateVariables.map((variable) => ({
    type: 'text',
    text: variable.toString(),
  }))
  const components = hasAtleastOne(bodyParams) ? [new BodyComponent(...bodyParams)] : []
  const template = new Template(templateName, language, ...components)

  const response = await whatsapp.sendMessage(botPhoneNumberId, userPhone, template)

  if ('error' in response) {
    const errorJSON = JSON.stringify(response.error)
    _logForBotAndThrow(
      `Failed to start WhatsApp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${errorJSON}`,
      logger
    )
  }

  logger
    .forBot()
    .info(
      `Successfully started WhatsApp conversation with template "${templateName}" and language "${templateLanguage}"${
        templateVariables && templateVariables.length
          ? ` using template variables: ${JSON.stringify(templateVariables)}`
          : ' without template variables'
      }`
    )

  return {
    conversationId: conversation.id,
  }
}

function _logForBotAndThrow(message: string, logger: bp.Logger): never {
  logger.forBot().error(message)
  throw new RuntimeError(message)
}

function _parseTemplateVariablesJSON(
  templateVariablesJson: string,
  logger: bp.Logger
): z.infer<typeof TemplateVariablesSchema> {
  let templateVariablesRaw = []

  try {
    templateVariablesRaw = JSON.parse(templateVariablesJson)
  } catch (err: any) {
    _logForBotAndThrow(
      `Value provided for Template Variables JSON isn't valid JSON (error: ${
        err?.message ?? ''
      }). Received: ${templateVariablesJson}`,
      logger
    )
  }

  const validationResult = TemplateVariablesSchema.safeParse(templateVariablesRaw)
  if (!validationResult.success) {
    _logForBotAndThrow(
      `Template variables should be an array of strings or numbers (error: ${validationResult.error})`,
      logger
    )
  }

  return validationResult.data
}
