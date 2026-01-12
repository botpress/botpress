import { RuntimeError } from '@botpress/client'
import { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints'
import { wrapAction } from '../action-wrapper'

export const getDataSource = wrapAction(
  { actionName: 'getDataSource', errorMessage: 'Failed to fetch data source' },
  async ({ notionClient }, { dataSourceId }) => {
    const [dataSource, pagesResult] = await Promise.all([
      notionClient.getDataSource({ dataSourceId }),
      notionClient.enumerateDataSourceChildren({ dataSourceId }),
    ])

    if (!dataSource) {
      throw new RuntimeError(`Data source with ID ${dataSourceId} not found`)
    }

    const pages = pagesResult.results.map((page) => {
      let title = ''

      if (page.object === 'page' && 'properties' in page) {
        const titleProp = Object.values(page.properties).find(
          (prop): prop is { type: 'title'; title: RichTextItemResponse[]; id: string } =>
            prop !== null && 'type' in prop && prop.type === 'title'
        )
        if (titleProp && 'title' in titleProp) {
          title = titleProp.title.map((t) => t.plain_text).join('')
        }
      }

      return {
        id: page.id,
        title,
        pageProperties: page.properties,
      }
    })

    return {
      object: dataSource.object,
      properties: dataSource.properties,
      pages,
    }
  }
)
