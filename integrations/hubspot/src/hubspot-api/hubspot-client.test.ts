import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HubspotClient } from './hubspot-client'
import * as bp from '.botpress'

const hsMock = vi.hoisted(() => ({
  crm: {
    properties: { coreApi: { getAll: vi.fn() } },
    contacts: { searchApi: { doSearch: vi.fn() } },
  },
}))

vi.mock('@hubspot/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@hubspot/api-client')>()),
  Client: vi.fn(() => hsMock),
}))

// Mirrors the bridge's `state_item_payload_bytes` limit (skynet packages/const/src/limits.ts)
const STATE_PAYLOAD_LIMIT = 131_072

const apiError = (code: number, type: string, message: string) => Object.assign(new Error(message), { code, type })

const buildPortalProperties = (customPropertyCount: number) => {
  const custom = Array.from({ length: customPropertyCount }, (_, i) => ({
    name: `custom_property_${i}`,
    label: `Custom property number ${i} used by the sales team`,
    type: i % 5 === 0 ? 'enumeration' : 'string',
    hubspotDefined: false,
    options: i % 5 === 0 ? Array.from({ length: 10 }, (_, j) => ({ value: `option_value_${j}` })) : [],
  }))
  return [
    { name: 'firstname', label: 'First Name', type: 'string', hubspotDefined: true, options: [] },
    { name: 'telefone_blip', label: 'Telefone Blip', type: 'string', hubspotDefined: false, options: [] },
    ...custom,
  ]
}

const buildBotpressClient = () => {
  const states = new Map<string, unknown>()
  return {
    getState: vi.fn(async ({ name }: { name: string }) => {
      if (!states.has(name)) {
        throw apiError(404, 'ResourceNotFound', `State "${name}" doesn't exist`)
      }
      return { state: { payload: states.get(name) } }
    }),
    setState: vi.fn(async ({ name, payload }: { name: string; payload: unknown }) => {
      const size = JSON.stringify(payload).length
      if (size > STATE_PAYLOAD_LIMIT) {
        throw apiError(
          413,
          'PayloadTooLarge',
          `Limit exceeded for state_item_payload_bytes, attempted to use ${size} but maximum is ${STATE_PAYLOAD_LIMIT}`
        )
      }
      states.set(name, payload)
      return { state: { payload } }
    }),
  }
}

const noop = () => {}
const logger = { forBot: () => ({ debug: noop, info: noop, warn: noop, error: noop }) }

const buildHubspotClient = (client = buildBotpressClient()) =>
  new HubspotClient({
    accessToken: 'test-token',
    client: client as unknown as bp.Client,
    ctx: { integrationId: 'intver_test' } as bp.Context,
    logger: logger as unknown as bp.Logger,
  })

const searchContact = (hsClient: HubspotClient, propertiesToReturn: string[]) =>
  hsClient.searchContact({ phone: '31995540731', propertiesToReturn })

describe('HubspotClient.searchContact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(noop)
    hsMock.crm.properties.coreApi.getAll.mockResolvedValue({ results: buildPortalProperties(50) })
    hsMock.crm.contacts.searchApi.doSearch.mockResolvedValue({ results: [{ id: '123', properties: {} }] })
  })

  it('accepts valid properties when the property list is too large to cache', async () => {
    const properties = buildPortalProperties(1500)
    const trimmed = Object.fromEntries(
      properties.map((p) => [p.name, { label: p.label, type: p.type, options: p.options.map((o) => o.value) }])
    )
    expect(JSON.stringify({ properties: trimmed }).length).toBeGreaterThan(STATE_PAYLOAD_LIMIT)
    hsMock.crm.properties.coreApi.getAll.mockResolvedValue({ results: properties })
    const client = buildBotpressClient()

    const contact = await searchContact(buildHubspotClient(client), ['firstname', 'telefone_blip'])

    expect(contact?.id).toBe('123')
    expect(client.setState).toHaveBeenCalledOnce()
    expect(hsMock.crm.properties.coreApi.getAll).toHaveBeenCalledOnce()
  })

  it('reuses the saved property list on the next invocation', async () => {
    const client = buildBotpressClient()

    await searchContact(buildHubspotClient(client), ['firstname'])
    await searchContact(buildHubspotClient(client), ['telefone_blip'])

    expect(hsMock.crm.properties.coreApi.getAll).toHaveBeenCalledOnce()
  })

  it('still rejects a property that does not exist', async () => {
    await expect(searchContact(buildHubspotClient(), ['not_a_property'])).rejects.toThrow(
      'Unknown properties: not_a_property'
    )
  })

  it('surfaces the real error instead of reporting the property as unknown', async () => {
    hsMock.crm.properties.coreApi.getAll.mockRejectedValue(apiError(503, 'ServiceUnavailable', 'Service Unavailable'))

    const search = searchContact(buildHubspotClient(), ['firstname'])

    await expect(search).rejects.toThrow('status code 503')
    await expect(search).rejects.not.toThrow('Unknown properties')
  })
})
