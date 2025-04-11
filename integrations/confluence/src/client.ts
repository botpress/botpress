import type { configuration } from '.botpress'
import axios from 'axios'
import type { Page } from 'definitions/entities/page'

export const ConfluenceClient = ({ user, host, apiToken }: configuration.Configuration) => {
  const auth = Buffer.from(`${user}:${apiToken}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }

  return {
    getPages: async () => {
      const response = await axios.get(`${host}/wiki/api/v2/pages?body-format=ATLAS_DOC_FORMAT`, config)
      return { items: response.data.results as Page.InferredType[], token: response?.data?._links?.next }
    },
    getPage: async ({ pageId }: { pageId: number }) => {
      const response = await axios.get(`${host}/wiki/api/v2/pages/${pageId}?body-format=ATLAS_DOC_FORMAT`, config)
      return response.data
    },
    writeFooterComment: async ({ pageId }: { pageId: number }) => {
      const response = await axios.get(`${host}/wiki/api/v2/pages/${pageId}`, config)
      return response.data
    },
  }
}
