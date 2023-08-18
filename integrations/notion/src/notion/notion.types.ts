import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export type Valueof<T> = T[keyof T]
export type NotionPagePropertyTypes = Valueof<PageObjectResponse['properties']>['type']
