import type { NotionPagePropertyTypes } from './notion.types'

/**
 * the properties with type `null` cannot be updated via the API
 */
export const NOTION_PROPERTY_STRINGIFIED_TYPE_MAP: Record<NotionPagePropertyTypes, string> = {
  date: '{start:string;end:string}',
  url: 'string',
  select: '{name:string}',
  phone_number: 'string',
  checkbox: '{start:string;end:string}',
  files: 'Array<{name:string;external:{url:string}}>',
  email: 'string',
  number: 'number',
  title: 'Array<{type:"text",text:{content:string;link:null}}>',
  created_time: '{start:string;end:string}',
  last_edited_time: 'null',
  last_edited_by: 'null',
  rich_text: 'Array<{type:"text",text:{content:string;link:null}}>',
  people: 'Array<{object:"user";id:string}>',
  relation: 'Array<{id:string}>',
  rollup: 'null',
  formula: 'null',
  multi_select: 'Array<{name:string}>',
  created_by: '{start:string;end:string}',
  status: '{name:string}',
  unique_id: '{start:string;end:string}',
}
