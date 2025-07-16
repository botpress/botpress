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
  | 'view'
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

  type Space = {
    id: string
    name: string
    type: 'global' | 'collaboration' | 'knowledge_base' | 'personal'
    status: 'current' | 'archived'
    homepageId: string
  }

  type HierarchicalContentType = 'database' | 'embed' | 'folder' | 'page' | 'whiteboard'
  type HierarchicalChild = {
    id: string
    type: HierarchicalContentType
    status: 'current' | 'archived'
    title: string
    spaceId: string
  }

  return {
    getAllSpaces: async ({ nextToken: prevToken }: { nextToken?: string }) => {
      const queryParams = new URLSearchParams({
        limit: '250', // maximum limit for Confluence API
        status: 'current', // we don't want archived spaces
        ...(prevToken ? { cursor: prevToken } : {}),
      })
      const response = await axios.get(`${apiBase}/spaces?${queryParams.toString()}`, config)
      const nextToken = _extractNextToken(response)
      const results = response.data.results as Space[]
      return {
        items: results.filter((item) => item.status === 'current'),
        token: nextToken,
      }
    },
    getSpace: async ({ spaceId }: { spaceId: number }) => {
      const response = await axios.get(`${apiBase}/spaces/${spaceId}`, config)
      return response.data as Space
    },
    getPage: async ({ pageId }: { pageId: number }) => {
      const response = await axios.get(`${apiBase}/pages/${pageId}?body-format=ATLAS_DOC_FORMAT`, config)
      return response.data as Page.InferredType
    },
    getPageHtml: async ({ pageId }: { pageId: number }): Promise<string | undefined> => {
      const response = await axios.get(`${apiBase}/pages/${pageId}?body-format=view`, config)
      return response.data.body?.view?.value
    },
    getDirectChildren: async ({
      entityId,
      entityType,
      nextToken: prevToken,
    }: {
      entityId: number
      entityType: HierarchicalContentType
      nextToken?: string
    }) => {
      const queryParams = new URLSearchParams({
        limit: '250', // maximum limit for Confluence API
        ...(prevToken ? { cursor: prevToken } : {}),
      })
      const response = await axios.get(
        `${apiBase}/${entityType}s/${entityId}/direct-children?${queryParams.toString()}`,
        config
      )
      const nextToken = _extractNextToken(response)
      const results = response.data.results as HierarchicalChild[]
      return {
        items: results.filter((item) => item.status === 'current'),
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

      const value = await convertMarkdownToHtml(input.item.body.atlas_doc_format.value)
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

      const value = await convertMarkdownToHtml(input.item.body.atlas_doc_format.value)

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
