import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

type Valueof<T> = T[keyof T]
export type NotionPagePropertyTypes = Valueof<PageObjectResponse['properties']>['type']
