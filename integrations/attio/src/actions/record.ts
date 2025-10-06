//
import { RuntimeError } from '@botpress/client'
import { AttioApiClient, Attribute } from '../attio-api'
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
        const label = String(opt.label ?? opt.name ?? opt.value ?? opt.title ?? opt.slug ?? oid)
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

function _mapValues(values: { attribute: string; value: string }[]) {
  return values.reduce((acc: Record<string, any>, curr) => {
    acc[curr.attribute] = curr.value
    return acc
  }, {})
}

export const listRecords: bp.IntegrationProps['actions']['listRecords'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object, filter, sorts, limit, offset } = input

  const filterMap = filter ? _mapValues(filter) : undefined

  try {
    const data = await attioApiClient.listRecords(object, { filter: filterMap, sorts, limit, offset })
    const attributes = await attioApiClient.listAttributes(object)

    const { idToSlug, slugToOptionLabelById } = _buildAttributeMaps(attributes.data)
    const humanized = data.data.map((rec) => _humanizeRecordValues(rec, idToSlug, slugToOptionLabelById))

    return { data: humanized }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const getRecord: bp.IntegrationProps['actions']['getRecord'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object, id } = input

  try {
    const data = await attioApiClient.getRecord(object, id.record_id)
    const attributes = await attioApiClient.listAttributes(object)

    const { idToSlug, slugToOptionLabelById } = _buildAttributeMaps(attributes.data)
    const humanized = _humanizeRecordValues(data.data, idToSlug, slugToOptionLabelById)

    return { data: humanized }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const createRecord: bp.IntegrationProps['actions']['createRecord'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object, data } = input
  const { values } = data

  try {
    const valuesMap = _mapValues(values)

    const data = await attioApiClient.createRecord(object, { data: { values: valuesMap } })
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const updateRecord: bp.IntegrationProps['actions']['updateRecord'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object, id, data } = input
  const { values } = data

  try {
    const valuesMap = _mapValues(values)
    const data = await attioApiClient.updateRecord(object, id.record_id, { data: { values: valuesMap } })
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}

export const listAttributes: bp.IntegrationProps['actions']['listAttributes'] = async (props) => {
  const { ctx, input } = props
  const accessToken = ctx.configuration.accessToken

  const attioApiClient = new AttioApiClient(accessToken)

  const { object } = input

  try {
    const data = await attioApiClient.listAttributes(object)
    return { data: data.data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    throw new RuntimeError(error.message)
  }
}
