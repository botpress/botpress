import { test, expect } from 'vitest'
import { prepareIntegrationsUpdate } from './integration-utils'

test('new integration with no enabled field should default to enabled: false', () => {
  const result = prepareIntegrationsUpdate({ telegram: {} }, {})
  expect(result['telegram']).toMatchObject({ enabled: false })
})

test('new integration with enabled: true should remain enabled: true', () => {
  const result = prepareIntegrationsUpdate({ telegram: { enabled: true } }, {})
  expect(result['telegram']).toMatchObject({ enabled: true })
})

test('removed integration passed as null should remain null', () => {
  const result = prepareIntegrationsUpdate({ telegram: null }, { telegram: { enabled: true } })
  expect(result['telegram']).toBeNull()
})
