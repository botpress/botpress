//
import * as bp from '.botpress'
// Import shared types from record.ts to avoid duplication
import type { AttioListResponse, AttioItemResponse } from './record'

type AttioObject = {
  id?: {
    workspace_id: string
    object_id: string
  }
  api_slug?: string
  singular_noun?: string
  plural_noun?: string
  created_at?: string
}

type Attribute = {
  id?: {
    workspace_id: string
    object_id: string
    attribute_id: string
  }
  title?: string
  description?: string | null
  api_slug?: string
  type?: string
  slug?: string
  options?: { id?: string; label?: string; name?: string; value?: string; title?: string; slug?: string }[]
}

export const listObjects: bp.IntegrationProps['actions']['listObjects'] = async (props) => {
  const { ctx, logger } = props
  const accessToken = ctx.configuration.accessToken

  try {
    const response = await fetch('https://api.attio.com/v2/objects', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as AttioListResponse<AttioObject>
    const data = json.data ?? []
    return { data }
  } catch (err) {
    logger.forBot().error('Attio listObjects failed', err)
    return { data: [] }
  }
}

export const getObject: bp.IntegrationProps['actions']['getObject'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as AttioItemResponse<AttioObject>
    const data = json.data ?? ({} as AttioObject)
    return { data }
  } catch (err) {
    logger.forBot().error('Attio getObject failed', err)
    return { data: {} as AttioObject }
  }
}

export const listAttributes: bp.IntegrationProps['actions']['listAttributes'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/attributes`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as AttioListResponse<Attribute>
    logger.forBot().info('Attio listAttributes', { data: json.data })
    const data = json.data ?? []
    return { data }
  } catch (err) {
    logger.forBot().error('Attio listAttributes failed', err)
    return { data: [] }
  }
}
