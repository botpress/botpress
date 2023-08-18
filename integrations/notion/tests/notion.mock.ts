import { GetDatabaseResponse } from '@notionhq/client/build/src/api-endpoints'
import { NOTION_PROPERTY_STRINGIFIED_TYPE_MAP } from '../src/notion/notion.constants'

export const MOCK_RESPONSE_1: GetDatabaseResponse = {
  object: 'database',
  id: 'e819c5b1-77f8-4a7d-953c-3dc9e9c46037',
  cover: {
    type: 'external',
    external: {
      url: 'https://images.unsplash.com/photo-1546177461-79dfec0b0928?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1974&q=80',
    },
  },
  icon: { type: 'external', external: { url: 'https://www.notion.so/icons/book-closed_lightgray.svg' } },
  created_time: '2023-07-06T21:38:00.000Z',
  created_by: { object: 'user', id: '2b76f457-7e30-4f66-8e74-da55469e64c8' },
  last_edited_by: { object: 'user', id: '2b76f457-7e30-4f66-8e74-da55469e64c8' },
  last_edited_time: '2023-07-07T00:30:00.000Z',
  title: [
    {
      type: 'text',
      text: { content: 'Reading List', link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: 'Reading List',
      href: null,
    },
  ],
  description: [
    {
      type: 'text',
      text: {
        content:
          "📚 The modern day reading list includes more than just books. We've created a dashboard to help you track books, articles, podcasts, and videos. Each media type has its own view based on the Type property. \n\n✂️ One more thing... if you install the ",
        link: null,
      },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text:
        "📚 The modern day reading list includes more than just books. We've created a dashboard to help you track books, articles, podcasts, and videos. Each media type has its own view based on the Type property. \n\n✂️ One more thing... if you install the ",
      href: null,
    },
    {
      type: 'text',
      text: { content: 'Notion Web Clipper', link: { url: 'https://www.notion.so/web-clipper' } },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: 'Notion Web Clipper',
      href: 'https://www.notion.so/web-clipper',
    },
    {
      type: 'text',
      text: {
        content:
          ', you can save links off the web directly to this table.\n\n👇 Click through the different database tabs to see other views. Sort content by status, author, type, or publisher.',
        link: null,
      },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text:
        ', you can save links off the web directly to this table.\n\n👇 Click through the different database tabs to see other views. Sort content by status, author, type, or publisher.',
      href: null,
    },
  ],
  is_inline: false,
  properties: {
    Score: {
      id: ')Y7%22',
      name: 'Score',
      type: 'select',
      select: {
        options: [
          { id: '5c944de7-3f4b-4567-b3a1-fa2c71c540b6', name: '⭐️⭐️⭐️⭐️⭐️', color: 'default' },
          { id: 'b7307e35-c80a-4cb5-bb6b-6054523b394a', name: '⭐️⭐️⭐️⭐️', color: 'default' },
          { id: '9b1e1349-8e24-40ba-bbca-84a61296bc81', name: '⭐️⭐️⭐️', color: 'default' },
          { id: '66d3d050-086c-4a91-8c56-d55dc67e7789', name: '⭐️⭐️', color: 'default' },
          { id: 'd3782c76-0396-467f-928e-46bf0c9d5fba', name: '⭐️', color: 'default' },
          { id: 'f8966551-1d96-4106-b0c5-7ca459029bab', name: 'TBD', color: 'default' },
        ],
      },
    },
    Type: {
      id: '%2F7eo',
      name: 'Type',
      type: 'select',
      select: {
        options: [
          { id: '42a0b2e8-c8da-4e5d-a2f2-5ccba15d1034', name: 'Book', color: 'default' },
          { id: 'f96d0d0a-5564-4a20-ab15-5f040d49759e', name: 'Article', color: 'default' },
          { id: '4ac85597-5db1-4e0a-9c02-445575c38f76', name: 'TV Series', color: 'default' },
          { id: '2991748a-5745-4c3b-9c9b-2d6846a6fa1f', name: 'Film', color: 'default' },
          { id: '82f3bace-be25-410d-87fe-561c9c22492f', name: 'Podcast', color: 'default' },
          { id: '861f1076-1cc4-429a-a781-54947d727a4a', name: 'Academic Journal', color: 'default' },
          { id: '9cc30548-59d6-4cd3-94bc-d234081525c4', name: 'Essay Resource', color: 'default' },
        ],
      },
    },
    Status: {
      id: 'UMCM',
      name: 'Status',
      type: 'status',
      status: {
        options: [
          { id: '387caf66-e381-4bfa-bddc-ef3c33b1670e', name: 'Not started', color: 'red' },
          { id: '2bbcb9a8-1df1-47b6-a6af-2dafbf814871', name: 'In progress', color: 'blue' },
          { id: 'aac65976-840a-47bd-8f97-782176d2d4f2', name: 'Done', color: 'green' },
        ],
        groups: [
          {
            id: '7c521ba2-0e95-4bc2-95f6-48f6e44f1dc7',
            name: 'To-do',
            color: 'gray',
            option_ids: ['387caf66-e381-4bfa-bddc-ef3c33b1670e'],
          },
          {
            id: '4f3189a4-747d-4398-95ee-8b7c111a6f7a',
            name: 'In progress',
            color: 'blue',
            option_ids: ['2bbcb9a8-1df1-47b6-a6af-2dafbf814871'],
          },
          {
            id: 'b1ae6339-5453-45aa-8e00-b6e1b34e9064',
            name: 'Complete',
            color: 'green',
            option_ids: ['aac65976-840a-47bd-8f97-782176d2d4f2'],
          },
        ],
      },
    },
    Link: { id: 'VVMi', name: 'Link', type: 'url', url: {} },
    Completed: { id: 'qGBj', name: 'Completed', type: 'date', date: {} },
    Author: { id: 'qNw_', name: 'Author', type: 'rich_text', rich_text: {} },
    Name: { id: 'title', name: 'Name', type: 'title', title: {} },
  },
  parent: { type: 'workspace', workspace: true },
  url: 'https://www.notion.so/e819c5b177f84a7d953c3dc9e9c46037',
  public_url: null,
  archived: false,
}

export const MOCK_RESPONSE_1_PROCESSED = `{Score:{type:"select";"select":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.select}},Type:{type:"select";"select":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.select}},Status:{type:"status";"status":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.status}},Link:{type:"url";"url":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.url}},Completed:{type:"date";"date":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.date}},Author:{type:"rich_text";"rich_text":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.rich_text}},Name:{type:"title";"title":${NOTION_PROPERTY_STRINGIFIED_TYPE_MAP.title}}}`
