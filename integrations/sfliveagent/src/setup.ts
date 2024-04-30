import { IntegrationProps } from '../.botpress/implementation'

export const register: IntegrationProps['register'] = async ({ client, ctx, webhookUrl, logger }) => {
  logger.forBot().debug('Setting webhookUrl as ' + webhookUrl)
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'pollingMs',
    payload: { webhookUrl }
  })
}

export const unregister: IntegrationProps['unregister'] = async ({}) => {

}
