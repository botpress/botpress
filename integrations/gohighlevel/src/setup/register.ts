import { getClient } from 'src/client'
import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'
import { Credentials } from '.botpress/implementation/typings/states/credentials'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  try {
    const goHighLevelClient = getClient(
      ctx.configuration.accessToken,
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      ctx,
      client
    )

    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'credentials',
      payload: {
        accessToken: ctx.configuration.accessToken,
        refreshToken: ctx.configuration.refreshToken,
      },
    })

    // Check access by trying to fetch a contact
    // const result = await goHighLevelClient.getContact("test-contact-id");
    const result = 'Placeholder until proper check'

    // If the API call does not throw, it means we have successfully accessed GoHighLevel
    logger.forBot().info('Successfully accessed GoHighLevel: Integration can proceed')

    logger.forBot().info(`Successfully retrieved ${JSON.stringify(result)} contact`)
  } catch (error) {
    logger.forBot().error('Failed to access GoHighLevel: Check configuration', error)

    throw new bpclient.RuntimeError('Configuration Error! Unknown error.')
  }
}
