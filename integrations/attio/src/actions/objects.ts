//
import { RuntimeError } from '@botpress/client'
import { AttioApiClient } from '../attio-api'
import * as bp from '.botpress'

export const listObjects: bp.IntegrationProps['actions']['listObjects'] = async (props) => {
  const { ctx } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  try {
    const data = await attioApiClient.listObjects()
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const getObject: bp.IntegrationProps['actions']['getObject'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object } = input

  try {
    const data = await attioApiClient.getObject(object)
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const listAttributes: bp.IntegrationProps['actions']['listAttributes'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object } = input

  try {
    const data = await attioApiClient.listAttributes(object)
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}
