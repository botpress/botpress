import { isAxiosError } from 'axios'
import { makeRequest } from '../misc/utils/api-utils'
import { getSfCredentials } from '../misc/utils/bp-utils'
import { handleError } from '../misc/utils/error-utils'
import { refreshSfToken } from '../misc/utils/sf-utils'
import * as bp from '.botpress'

export const makeApiRequest: bp.IntegrationProps['actions']['makeApiRequest'] = async (props) => {
  const { input, client, ctx, logger } = props

  const sfCredentials = await getSfCredentials(client, ctx.integrationId)

  const url = `${sfCredentials.instanceUrl}/services/data/v54.0/${input.path}`

  try {
    const res = await makeRequest(url, input, sfCredentials.accessToken)

    return {
      success: true,
      status: res.status,
      body: res.data,
    }
  } catch (e) {
    const errorMsg = "'Make API request' error:"

    if (isAxiosError(e)) {
      const status = e.response?.status
      logger
        .forBot()
        .warn(
          `Salesforce API request failed with HTTP status ${status ?? 'unknown'} (axios code: ${e.code ?? 'unknown'})`
        )

      if (status === 401) {
        try {
          logger.forBot().info('Salesforce access token expired, attempting to refresh it')
          await refreshSfToken(client, ctx, logger)

          const newSfCredentials = await getSfCredentials(client, ctx.integrationId)

          const res = await makeRequest(url, input, newSfCredentials.accessToken)

          return {
            success: true,
            status: res.status,
            body: res.data,
          }
        } catch (e) {
          return handleError(errorMsg, e, logger)
        }
      }

      logger
        .forBot()
        .warn(
          `Salesforce API request error is not an expired access token, skipping token refresh (HTTP ${status ?? 'unknown'})`
        )
    }

    return handleError(errorMsg, e, logger)
  }
}
export const ApiActions = {
  makeApiRequest,
}
