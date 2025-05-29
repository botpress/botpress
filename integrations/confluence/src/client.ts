import axios from 'axios'

import type { Page } from 'definitions/entities/page'
import { convertMarkdownToHtml } from './parser/markdownToHtml'
import type { configuration } from '.botpress'

type BasePageBody = {
  status: string | null
  title: string | null
  parentId: string | null
  body: Body | null
}

type Body = {
  representation: Representation
  value: string
}

type Representation =
  | 'storage' // storage means HTML
  | 'atlas_doc_format' // format parsed for conversion to markdown
export type CreatePageBody = {
  spaceId: string
} & BasePageBody

export type UpdatePageBody = {
  id: string | null
  version: {
    number: number
    message: string
  } | null
} & BasePageBody

type CreateFooterBody = {
  pageId: string
  body: Body
}

export const ConfluenceClient = ({ user, host, apiToken }: configuration.Configuration) => {
  const auth = Buffer.from(`${user}:${apiToken}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }

  const apiBase = `${host}/wiki/api/v2` as const

  const _extractNextToken = (response: { data: { _links?: { next?: string } } }) =>
    response?.data?._links?.next
      ? (new URLSearchParams(response.data._links.next.split('?')[1]).get('cursor') ?? undefined)
      : undefined

  return {
    getAllPagesRecursively: async (prevToken?: string) => {
      const queryParams = new URLSearchParams({
        'body-format': 'ATLAS_DOC_FORMAT',
        status: 'current', // we don't want archived or deleted pages
        limit: '250', // maximum limit for Confluence API
        ...(prevToken ? { cursor: prevToken } : {}),
      })
      const response = await axios.get(`${apiBase}/pages?${queryParams.toString()}`, config)
      return {
        items: response.data.results as Page.InferredType[],
        token: _extractNextToken(response),
      }
    },
    getPage: async ({ pageId }: { pageId: number }) => {
      const response = await axios.get(`${apiBase}/pages/${pageId}?body-format=ATLAS_DOC_FORMAT`, config)
      return response.data as Page.InferredType
    },
    getPageDirectChildren: async ({ pageId, nextToken: prevToken }: { pageId: number; nextToken?: string }) => {
      const queryParams = new URLSearchParams({
        limit: '250', // maximum limit for Confluence API
        ...(prevToken ? { cursor: prevToken } : {}),
      })
      const response = await axios.get(`${apiBase}/pages/${pageId}/direct-children?${queryParams.toString()}`, config)
      const nextToken = _extractNextToken(response)
      const results = response.data.results as (Pick<Page.InferredType, 'id' | 'status' | 'title'> & { type: string })[]
      return {
        items: results.filter((item) => item.type === 'page' && item.status === 'current'),
        token: nextToken,
      }
    },
    writeFooterComment: async ({ pageId, text }: { pageId: string; text: string }) => {
      const footerBody: CreateFooterBody = {
        pageId,
        body: {
          representation: 'storage',
          value: text,
        },
      }
      const response = await axios.post(`${apiBase}/footer-comments`, footerBody, config)
      return response?.data
    },
    getFooterComments: async ({ pageId }: { pageId: string }) => {
      const response = await axios.get(
        `${apiBase}/pages/${pageId}/footer-comments?body-format=atlas_doc_format`,
        config
      )
      return response?.data
    },
    createPage: async (input: { item: Page.InferredType }) => {
      if (!input.item.body) {
        throw new Error('Body is required')
      }

      const value = convertMarkdownToHtml(input.item.body.atlas_doc_format.value)
      const request: CreatePageBody = {
        spaceId: input.item.spaceId,
        status: 'current',
        title: input.item.title ?? 'Temporary title',
        parentId: input.item.parentId,
        body: {
          representation: 'storage',
          value,
        },
      }

      const response = await axios.post(`${apiBase}/pages`, request, config)
      return response.data
    },
    deletePage: async (pageId: string) => {
      const response = await axios.delete(`${apiBase}/pages/${pageId}`, config)
      return response.data
    },
    updatePage: async (input: { item: Page.InferredType }) => {
      if (!input.item.body) {
        throw new Error('Body is required')
      }

      const value = convertMarkdownToHtml(input.item.body.atlas_doc_format.value)

      const request: UpdatePageBody = {
        id: input.item.id,
        status: 'current',
        title: input.item.title ?? 'Temporary title',
        parentId: input.item.parentId,
        body: {
          representation: 'storage',
          value,
        },
        version: {
          number: input?.item?.version?.number ?? 0,
          message: 'Updated by botpress',
        },
      }

      const response = await axios.post(`${apiBase}/page/${input.item.id}`, request, config)
      return response.data
    },
  }
}
