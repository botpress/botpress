import type { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_PROPERTY_STRINGIFIED_TYPE_MAP } from './consts'

/**
 * @returns a stringified type definition of the database properties
 * This can be useful when instructing GPT to parse some data to fit the db model
 * which can be then passed as properties to `addPageToDb`
 *
 * These are based on the [Notion Page Properties](https://developers.notion.com/reference/page-property-values)
 */
export function getDbStructure(response: GetDatabaseResponse): string {
  const properties = Object.entries(response.properties)
  const stringifiedTypes: string = properties.reduce((_stringifiedTypes, [key, value], index) => {
    _stringifiedTypes += `${key}:{type:"${value.type}";"${value.type}":${
      NOTION_PROPERTY_STRINGIFIED_TYPE_MAP[value.type]
    }}`
    if (index === properties.length - 1) {
      _stringifiedTypes += '}'
    } else {
      _stringifiedTypes += ','
    }
    return _stringifiedTypes
  }, '{')

  return stringifiedTypes
}
