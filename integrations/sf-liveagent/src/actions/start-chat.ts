import { getSalesforceClient } from 'src/client'
import { SFLiveagentConfig } from 'src/definitions/schemas'
import { IntegrationProps } from '.botpress'

export const startChat: IntegrationProps['actions']['startChat'] = async ({ ctx, input }) => {

  const salesforceClient = getSalesforceClient({ ...ctx.configuration as SFLiveagentConfig }, input.session)

  await salesforceClient.startChat({ userName: input.userName })

  return {}
}
