import { RecordResult } from '../../../definitions/common-schemas'
import { SalesforceObject } from '../../misc/types'
import { handleError } from '../../misc/utils/error-utils'
import { getConnection, getRequestPayload } from '../../misc/utils/sf-utils'
import * as bp from '.botpress'

export const updateSalesforceRecord = async (
  objectType: SalesforceObject,
  props: bp.ActionProps['updateContact'] | bp.ActionProps['updateLead'] | bp.ActionProps['updateCase']
): Promise<RecordResult> => {
  const { client, ctx, input, logger } = props

  const errorMsg = `'Update ${objectType}' error:`

  try {
    const payload = getRequestPayload(input)

    logger.forBot().info(`Attempting to update a ${objectType} from ${JSON.stringify(payload)}`)

    const connection = await getConnection(client, ctx, logger)
    const response = await connection.sobject(objectType).update(payload)

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger)
    }

    logger.forBot().info(`Successfully updated contact with data ${JSON.stringify(input)}`)
    return response
  } catch (error) {
    return handleError(errorMsg, error, logger)
  }
}
