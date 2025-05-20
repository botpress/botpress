import type * as notionhq from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

export type NotionPagePropertyTypes = Valueof<PageObjectResponse['properties']>['type']

export type NotionTopLevelItem = Extract<
  Awaited<ReturnType<notionhq.Client['search']>>['results'][number],
  { parent: any }
>

export type NotionPageChild = Extract<
  Awaited<ReturnType<notionhq.Client['blocks']['children']['list']>>['results'][number],
  { parent: any; type: 'child_page' | 'child_database' }
>

export type NotionDatabaseChild = Extract<
  Awaited<ReturnType<notionhq.Client['databases']['query']>>['results'][number],
  { parent: any }
>

export type NotionItem = NotionTopLevelItem | NotionPageChild | NotionDatabaseChild
export type NotionPage = Extract<NotionItem, { object: 'page' }>
export type NotionDatabase = Extract<NotionItem, { object: 'database' }>
export type NotionChildPage = Extract<NotionItem, { object: 'block'; type: 'child_page' }>
export type NotionChildDatabase = Extract<NotionItem, { object: 'block'; type: 'child_database' }>

type Valueof<T> = T[Extract<keyof T, string>]
