import { RuntimeError } from '@botpress/sdk'
import { BambooHRClient } from 'src/api/bamboohr-client'
import * as bp from '.botpress'

export const getCompanyInfo: bp.IntegrationProps['actions']['getCompanyInfo'] = async ({ client, ctx, logger }) => {
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })
  try {
    return await bambooHrClient.getCompanyInfo()
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to get company info', error)
  }
}
