import { TemplateRecipient, SendEnvelopeInput } from 'definitions/actions'
import docusign from 'docusign-esign'
import { CONVERSATION_ID_FIELD_KEY } from '../config'

const _createTemplateRecipient = (recipientInfo: TemplateRecipient): docusign.TemplateRole => {
  const { email, name, role, accessCode } = recipientInfo
  return {
    email,
    name,
    roleName: role,
    accessCode,
  }
}

export const sendEnvelopeInputToEnvelopeDefinition = (input: SendEnvelopeInput): docusign.EnvelopeDefinition => {
  const { emailSubject, templateId, recipients, conversationId } = input

  return {
    emailSubject,
    templateId,
    templateRoles: recipients.map(_createTemplateRecipient),
    status: 'sent',
    customFields: {
      textCustomFields: [
        {
          name: CONVERSATION_ID_FIELD_KEY,
          value: conversationId,
          show: 'false',
        },
      ],
    },
  }
}
