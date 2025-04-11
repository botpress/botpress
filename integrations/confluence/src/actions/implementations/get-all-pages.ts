import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { Page } from 'definitions/entities/page'
import * as bp from '.botpress'

export const getAllPages: bp.IntegrationProps['actions']['getAllPages'] = async () => {
  try {
    const pageData = await getConfluencePages()
    if (!pageData) {
      throw new RuntimeError('Pages not found')
    }

    return pageData
  } catch (error) {
    throw new RuntimeError('Error in fetchConfluencePage', error as Error)
  }
}

export async function getConfluencePages() {
  const auth = Buffer.from(`${bp.secrets.CONFLUENCE_USER}:${bp.secrets.CONFLUENCE_API_TOKEN}`).toString('base64')

  const config = {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  }
  try {
    const response = await axios.get(
      `${bp.secrets.CONFLUENCE_HOST}/wiki/api/v2/pages?body-format=ATLAS_DOC_FORMAT`,
      config
    )

    return { items: response.data.results as Page.InferredType[], token: response?.data?._links?.next }
  } catch (err) {
    throw new RuntimeError('Error while calling confluence', err as Error)
  }
}
