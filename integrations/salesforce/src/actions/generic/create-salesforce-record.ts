import { RecordResult } from '../../../definitions/common-schemas'
import { SalesforceObject } from '../../misc/types'
import { handleError } from '../../misc/utils/error-utils'
import { getConnection, getRequestPayload } from '../../misc/utils/sf-utils'
import * as bp from '.botpress'

export const createSalesforceRecord = async (
  objectType: SalesforceObject,
  props: bp.ActionProps['createContact'] | bp.ActionProps['createLead'] | bp.ActionProps['createCase']
): Promise<RecordResult> => {
  const { client, ctx, input, logger } = props

  const errorMsg = `'Create ${objectType}' error:`

  try {
    const payload = getRequestPayload(input)

    logger.forBot().info(`Attempting to create a ${objectType} from from ${JSON.stringify(payload)}`)

    const connection = await getConnection(client, ctx, logger)
    const response = await connection.sobject(objectType).create(payload)

    if (!response.success) {
      return handleError(errorMsg, response.errors, logger)
    }

    logger.forBot().info(`Successfully created ${objectType} with id ${response.id}`)
    return response
  } catch (error) {
    return handleError(errorMsg, error, logger)
  }
}
