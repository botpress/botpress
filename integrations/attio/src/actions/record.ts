//
import * as bp from '.botpress'

type AttioRecordIdentifier = {
    workspace_id: string
    object_id: string
    record_id: string
}

type AttioRecord = {
    id: AttioRecordIdentifier
    created_at: string
    web_url: string
    values: Record<string, unknown>
}

export type AttioListResponse<T> = { data?: T[] }
export type AttioItemResponse<T> = { data?: T }

type AttributeOption = { id?: string; label?: string; name?: string; value?: string; title?: string; slug?: string }
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
  options?: AttributeOption[]
}

type LoggerCompat = {
  forBot(): {
    error: (...args: unknown[]) => void
    warn: (...args: unknown[]) => void
    info: (...args: unknown[]) => void
  }
}

async function _fetchAttributes(accessToken: string, object: string, logger: LoggerCompat): Promise<Attribute[]> {
  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/attributes`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as AttioListResponse<Attribute>
    return json?.data ?? []
  } catch (err) {
    logger.forBot().warn('Attio fetch attributes failed', err)
    return []
  }
}

function _buildAttributeMaps(attributes: Attribute[]) {
  const idToSlug: Record<string, string> = {}
  const slugToOptionLabelById: Record<string, Record<string, string>> = {}

  for (const attr of attributes) {
    // Handle new id structure (object with attribute_id) or fallback to old string id
    const id = typeof attr.id === 'object' ? attr.id?.attribute_id : String(attr.id ?? '')
    const slug = String(attr.slug ?? attr.api_slug ?? id)
    if (id) idToSlug[id] = slug

    if (Array.isArray(attr.options) && attr.options.length > 0) {
      const map: Record<string, string> = {}
      for (const opt of attr.options) {
        const oid = String(opt.id ?? '')
        if (!oid) continue
        const label = String(
          opt.label ?? opt.name ?? opt.value ?? opt.title ?? opt.slug ?? oid
        )
        map[oid] = label
      }
      slugToOptionLabelById[slug] = map
    }
  }

  return { idToSlug, slugToOptionLabelById }
}

function _mapValueUsingOptions(value: unknown, optionMap: Record<string, string>) {
  const mapOne = (v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const candidateId = (v as { id?: string }).id
      if (candidateId && optionMap[candidateId]) return optionMap[candidateId]
      return v
    }
    if (typeof v === 'string' && optionMap[v]) return optionMap[v]
    return v
  }

  if (Array.isArray(value)) return value.map((v) => mapOne(v))
  return mapOne(value)
}

function _humanizeRecordValues(
  record: AttioRecord,
  idToSlug: Record<string, string>,
  slugToOptionLabelById: Record<string, Record<string, string>>
) {
  const src: Record<string, unknown> = record?.values ?? {}
  const dst: Record<string, unknown> = {}

  for (const key of Object.keys(src)) {
    const slug = idToSlug[key] ?? key
    const optionMap = slugToOptionLabelById[slug]
    const raw = src[key]
    const value = optionMap ? _mapValueUsingOptions(raw, optionMap) : raw
    dst[slug] = value
  }

  return { ...record, values: dst }
}

export const listRecords: bp.IntegrationProps['actions']['listRecords'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path
  const { filter, sorts, limit, offset } = input.body

  try {
    const response = await fetch(`https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, sorts, limit, offset }),
    })
    const json = (await response.json()) as AttioListResponse<AttioRecord>
    const data = json.data ?? []
    const attributes = await _fetchAttributes(accessToken, object, logger)
    const { idToSlug, slugToOptionLabelById } = _buildAttributeMaps(attributes)
    const humanized = data.map((rec) => _humanizeRecordValues(rec, idToSlug, slugToOptionLabelById))
    return { data: humanized }
  } catch (err) {
    logger.forBot().error('Attio listRecords failed', err)
    return { data: [] }
  }
}

export const getRecord: bp.IntegrationProps['actions']['getRecord'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object, record_id } = input.path

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/${encodeURIComponent(
      record_id
    )}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    const json = (await response.json()) as AttioItemResponse<AttioRecord>
    const record = json.data
    
    if (!record) {
      const emptyRecord = { id: { workspace_id: '', object_id: '', record_id: '' }, created_at: '', web_url: '', values: {} }
      return { data: emptyRecord }
    }
    
    const attributes = await _fetchAttributes(accessToken, object, logger)
    const { idToSlug, slugToOptionLabelById } = _buildAttributeMaps(attributes)
    const humanized = _humanizeRecordValues(record, idToSlug, slugToOptionLabelById)
    return { data: humanized }

  } catch (err) {
    logger.forBot().error('Attio getRecord failed', err)
    const emptyRecord = { id: { workspace_id: '', object_id: '', record_id: '' }, created_at: '', web_url: '', values: {} }
    return { data: emptyRecord }
  }
}

export const createRecord: bp.IntegrationProps['actions']['createRecord'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object } = input.path
  const { values } = input.data

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { values } }),
    })
    const json = (await response.json()) as AttioItemResponse<AttioRecord>
    return { data: json.data ?? ({} as AttioRecord) }
  } catch (err) {
    logger.forBot().error('Attio createRecord failed', err)
    return { data: {} as AttioRecord }
  }
}

export const updateRecord: bp.IntegrationProps['actions']['updateRecord'] = async (props) => {
  const { ctx, input, logger } = props
  const accessToken = ctx.configuration.accessToken

  const { object, record_id } = input.path
  const { values } = input.data

  try {
    const url = `https://api.attio.com/v2/objects/${encodeURIComponent(object)}/records/${encodeURIComponent(
      record_id
    )}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { values } }),
    })
    const json = (await response.json()) as AttioItemResponse<AttioRecord>
    return { data: json.data ?? ({} as AttioRecord) }
  } catch (err) {
    logger.forBot().error('Attio updateRecord failed', err)
    return { data: {} as AttioRecord }
  }
}