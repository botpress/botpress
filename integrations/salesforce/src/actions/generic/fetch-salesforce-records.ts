import { SalesforceObject, QueryOutput } from '../../misc/types'
import { handleError } from '../../misc/utils/error-utils'
import { getSearchQuery } from '../../misc/utils/query-utils'
import { getConnection } from '../../misc/utils/sf-utils'
import * as bp from '.botpress'

export const fetchSalesforceRecords = async (
  objectType: SalesforceObject,
  props: bp.ActionProps['searchCases'] | bp.ActionProps['searchContacts'] | bp.ActionProps['searchLeads']
): Promise<QueryOutput> => {
  const { client, ctx, input, logger } = props
  logger.forBot().info(`Attempting to search ${objectType} from ${JSON.stringify(input)}`)
  const errorMsg = `'Search ${objectType}' error:`

  try {
    const connection = await getConnection(client, ctx, logger)
    const objectMeta = await connection.sobject(objectType).describe()
    const objectFields = objectMeta.fields.map((field) => field.name).join(', ')

    const searchQuery = getSearchQuery(objectType, input, objectFields)

    const response = await connection.query(searchQuery)

    logger.forBot().info(`Successfully searched ${objectType} from data ${JSON.stringify(input)}`)
    return { success: true, records: response.records }
  } catch (error) {
    return handleError(errorMsg, error, logger)
  }
}
