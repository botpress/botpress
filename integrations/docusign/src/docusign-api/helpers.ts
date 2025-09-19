import { TemplateRecipient, SendEnvelopeInput } from 'definitions/actions'
import docusign from 'docusign-esign'

const _createTemplateRecipient = (recipientInfo: TemplateRecipient): docusign.TemplateRole => {
  const { email, name, role } = recipientInfo
  return {
    email,
    name,
    roleName: role,
  }
}

export const sendEnvelopeInputToEnvelopeDefinition = (input: SendEnvelopeInput): docusign.EnvelopeDefinition => {
  const { emailSubject, templateId, recipients } = input

  return {
    emailSubject,
    templateId,
    templateRoles: recipients.map(_createTemplateRecipient),
    status: 'sent',
  }
}
