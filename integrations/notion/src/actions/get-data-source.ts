import { RuntimeError } from '@botpress/client'
import { wrapAction } from '../action-wrapper'

export const getDataSource = wrapAction(
  { actionName: 'getDataSource', errorMessage: 'Failed to fetch data source' },
  async ({ notionClient }, { dataSourceId }) => {
    const dataSource = await notionClient.getDataSource({ dataSourceId })
    if (!dataSource) {
      throw new RuntimeError(`Data source with ID ${dataSourceId} not found`)
    }
    return {
      object: dataSource.object,
      properties: dataSource.properties,
    }
  }
)
