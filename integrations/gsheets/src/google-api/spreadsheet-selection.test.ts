import * as sdk from '@botpress/sdk'
import { describe, it, expect, vi } from 'vitest'
import { getAllowedSpreadsheetIds, resolveSpreadsheetId } from './spreadsheet-selection'
import * as bp from '.botpress'

const OAUTH_CTX = { integrationId: 'int-1', configurationType: null } as unknown as bp.Context

const SERVICE_ACCOUNT_CTX = {
  integrationId: 'int-1',
  configurationType: 'serviceAccountKey',
  configuration: { spreadsheetId: 'from-config' },
} as unknown as bp.Context

const clientReturning = (payload: unknown) =>
  ({ getState: vi.fn(async () => ({ state: { payload } })) }) as unknown as bp.Client

const clientWithoutState = () =>
  ({ getState: vi.fn(async () => Promise.reject(new Error('state not found'))) }) as unknown as bp.Client

describe('getAllowedSpreadsheetIds', () => {
  it('returns the stored list in selection order', async () => {
    const client = clientReturning({ spreadsheetIds: ['a', 'b', 'c'] })

    await expect(getAllowedSpreadsheetIds({ ctx: OAUTH_CTX, client })).resolves.toEqual(['a', 'b', 'c'])
  })

  it('falls back to the legacy single spreadsheet id', async () => {
    const client = clientReturning({ spreadsheetId: 'legacy' })

    await expect(getAllowedSpreadsheetIds({ ctx: OAUTH_CTX, client })).resolves.toEqual(['legacy'])
  })

  it('prefers the list over the legacy field when both are present', async () => {
    const client = clientReturning({ spreadsheetIds: ['a', 'b'], spreadsheetId: 'legacy' })

    await expect(getAllowedSpreadsheetIds({ ctx: OAUTH_CTX, client })).resolves.toEqual(['a', 'b'])
  })

  it('returns the configured spreadsheet for service account setups', async () => {
    const client = clientWithoutState()

    await expect(getAllowedSpreadsheetIds({ ctx: SERVICE_ACCOUNT_CTX, client })).resolves.toEqual(['from-config'])
    expect(client.getState).not.toHaveBeenCalled()
  })

  it('returns nothing when the file picker was skipped', async () => {
    await expect(getAllowedSpreadsheetIds({ ctx: OAUTH_CTX, client: clientWithoutState() })).resolves.toEqual([])
  })

  it('returns nothing when the stored payload is empty', async () => {
    await expect(getAllowedSpreadsheetIds({ ctx: OAUTH_CTX, client: clientReturning({}) })).resolves.toEqual([])
  })
})

describe('resolveSpreadsheetId', () => {
  it('uses the first selected spreadsheet when the action does not specify one', async () => {
    const client = clientReturning({ spreadsheetIds: ['default', 'other'] })

    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client })).resolves.toBe('default')
  })

  it('uses the requested spreadsheet when it is one of the selected ones', async () => {
    const client = clientReturning({ spreadsheetIds: ['default', 'other'] })

    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: 'other' })).resolves.toBe(
      'other'
    )
  })

  it('treats a blank requested id as "use the default"', async () => {
    const client = clientReturning({ spreadsheetIds: ['default', 'other'] })

    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: '   ' })).resolves.toBe(
      'default'
    )
  })

  it('trims surrounding whitespace off the requested id', async () => {
    const client = clientReturning({ spreadsheetIds: ['default', 'other'] })

    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: '  other  ' })).resolves.toBe(
      'other'
    )
  })

  it('resolves against the legacy single spreadsheet id', async () => {
    const client = clientReturning({ spreadsheetId: 'legacy' })

    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client })).resolves.toBe('legacy')
    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: 'legacy' })).resolves.toBe(
      'legacy'
    )
  })

  it('rejects a spreadsheet that was not selected during setup', async () => {
    const client = clientReturning({ spreadsheetIds: ['default', 'other'] })

    await expect(
      resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: 'not-picked' })
    ).rejects.toThrow(sdk.RuntimeError)
    await expect(
      resolveSpreadsheetId({ ctx: OAUTH_CTX, client, requestedSpreadsheetId: 'not-picked' })
    ).rejects.toThrow(/default, other/)
  })

  it('lets service account setups target any shared spreadsheet', async () => {
    const client = clientWithoutState()

    await expect(
      resolveSpreadsheetId({ ctx: SERVICE_ACCOUNT_CTX, client, requestedSpreadsheetId: 'shared-elsewhere' })
    ).resolves.toBe('shared-elsewhere')
    await expect(resolveSpreadsheetId({ ctx: SERVICE_ACCOUNT_CTX, client })).resolves.toBe('from-config')
  })

  it('explains that no spreadsheet is configured when the picker was skipped', async () => {
    await expect(resolveSpreadsheetId({ ctx: OAUTH_CTX, client: clientWithoutState() })).rejects.toThrow(
      /No spreadsheet is configured/
    )
  })
})
