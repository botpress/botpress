import { RuntimeError } from '@botpress/sdk'
import { BambooHRClient } from 'src/api/bamboohr-client'
import * as bp from '.botpress'

export const getEmployeeBasicInfo: bp.IntegrationProps['actions']['getEmployeeBasicInfo'] = async ({
  client,
  ctx,
  logger,
  input,
}) => {
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })

  try {
    return await bambooHrClient.getEmployeeBasicInfo(input.id)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to get employee basic info', error)
  }
}

export const getEmployeeCustomInfo: bp.IntegrationProps['actions']['getEmployeeCustomInfo'] = async ({
  input,
  client,
  ctx,
  logger,
}) => {
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })

  try {
    return await bambooHrClient.getEmployeeCustomInfo(input.id, input.fields)
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to get employee custom info', error)
  }
}

export const listEmployees: bp.IntegrationProps['actions']['listEmployees'] = async ({ client, ctx, logger }) => {
  const bambooHrClient = await BambooHRClient.create({ client, ctx, logger })

  try {
    return await bambooHrClient.listEmployees()
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError('Failed to list employees', error)
  }
}
