import { Client, RuntimeError } from '@botpress/client'
import { name } from 'integration.definition'
import { WhatsAppAPI, Types } from 'whatsapp-api-js'
import z from 'zod'
import { CreateConversationPayload, IntegrationLogger, IntegrationContext } from '.'

const {
  Template: { Template, Language },
} = Types

export async function createConversation({
  client,
  channel,
  tags,
  ctx,
  logger,
}: {
  ctx: IntegrationContext
  client: Client
  logger: IntegrationLogger
} & CreateConversationPayload) {
  const phoneNumberId = ctx.configuration.phoneNumberId
  if (!phoneNumberId) {
    logForBotAndThrow('Phone number ID is not configured', logger)
  }

  const userPhoneTag = `${name}:userPhone`
  const userPhone = tags[userPhoneTag]
  if (!userPhone) {
    logForBotAndThrow(`A Whatsapp recipient phone number needs to be provided in the '${userPhoneTag}' tag`, logger)
  }

  /*
  Whatsapp only allows using Message Templates for proactively starting conversations with users.
  See: https://developers.facebook.com/docs/whatsapp/pricing#opening-conversations
  */
  const templateNameTag = `${name}:templateName`
  const templateName = tags[templateNameTag]
  if (!templateName) {
    logForBotAndThrow(`A Whatsapp template name needs to be provided in the '${templateNameTag}' tag`, logger)
  }

  const templateLanguageTag = `${name}:templateLanguage`
  const templateLanguage = tags[templateLanguageTag] || 'en_US'

  const templateVariablesTag = `${name}:templateVariables`
  const templateVariablesSchema = z.array(z.string().or(z.number()))
  let templateVariables: z.infer<typeof templateVariablesSchema> = []

  if (templateVariablesTag in tags) {
    let templateVariablesRaw = []

    try {
      templateVariablesRaw = JSON.parse(tags[templateVariablesTag]!)
    } catch (err) {
      logForBotAndThrow(
        `Value of ${templateVariablesTag} tag isn't valid JSON (error: ${(err as Error)?.message ?? ''}). Received: ${
          tags[templateVariablesTag]
        }})`,
        logger
      )
    }

    const validationResult = templateVariablesSchema.safeParse(templateVariablesRaw)
    if (!validationResult.success) {
      logForBotAndThrow(
        `Template variables should be an array of strings or numbers (error: ${validationResult.error}))`,
        logger
      )
    }

    templateVariables = validationResult.data
  }

  const { conversation } = await client.getOrCreateConversation({
    channel,
    tags: {
      [`${name}:phoneNumberId`]: phoneNumberId,
      [userPhoneTag]: userPhone,
      [templateNameTag]: templateName,
    },
  })

  const whatsapp = new WhatsAppAPI(ctx.configuration.accessToken)

  const template = new Template(templateName, new Language(templateLanguage), {
    type: 'body',
    parameters: templateVariables.map((variable) => ({
      type: 'text',
      text: variable,
    })),
  })

  const response = await whatsapp.sendMessage(phoneNumberId, userPhone, template)

  if (response?.error) {
    logForBotAndThrow(
      `Failed to start Whatsapp conversation using template "${templateName}" and language "${templateLanguage}" - Error: ${JSON.stringify(
        response.error
      )}`,
      logger
    )
  }

  logger
    .forBot()
    .info(
      `Successfully started Whatsapp conversation with template "${templateName}" and language "${templateLanguage}"${
        templateVariables && templateVariables.length
          ? ` using template variables: ${JSON.stringify(templateVariables)}`
          : ' without template variables'
      }`
    )

  return {
    body: JSON.stringify({ conversation: { id: conversation.id } }),
    headers: {},
    statusCode: 200,
  }
}

function logForBotAndThrow(message: string, logger: IntegrationLogger): never {
  logger.forBot().error(message)
  throw new RuntimeError(message)
}
