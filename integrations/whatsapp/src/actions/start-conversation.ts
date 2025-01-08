import { channel } from 'integration.definition'
import { getPhoneNumberId } from 'src/misc/whatsapp'
import { startConversation as startConversationImpl } from '../conversation'
import * as bp from '.botpress'

export const startConversation: bp.IntegrationProps['actions']['startConversation'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  const phoneNumberId: string | undefined = input.senderPhoneNumberId || (await getPhoneNumberId(client, ctx))

  if (!phoneNumberId) {
    throw new Error('phoneNumberId is required')
  }

  const conversation = await startConversationImpl(
    {
      channel,
      phoneNumberId,
      userPhone: input.userPhone,
      templateName: input.templateName,
      templateLanguage: input.templateLanguage,
      templateVariablesJson: input.templateVariablesJson,
    },
    { client, ctx, logger }
  )

  return {
    conversationId: conversation.id,
  }
}
