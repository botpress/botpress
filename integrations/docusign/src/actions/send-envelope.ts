import { DocusignClient } from '../docusign-api'
import { sendEnvelopeInputToEnvelopeDefinition } from '../docusign-api/helpers'
import * as bp from '.botpress'

export const sendEnvelope: bp.IntegrationProps['actions']['sendEnvelope'] = async ({ input, ...props }) => {
  const envelopeDef = sendEnvelopeInputToEnvelopeDefinition(input)

  const apiClient = await DocusignClient.create(props)
  const resp = await apiClient.sendEnvelope(envelopeDef)

  return {
    envelopeId: resp.envelopeId,
  }
}
