import { expect, test } from 'vitest'
import { MOCK_RESPONSE_1, MOCK_RESPONSE_1_PROCESSED } from './fixtures/mock-responses'
import { getDbStructure } from './db-structure'

test('getDBStructure', () => {
  const structure = getDbStructure(MOCK_RESPONSE_1)
  expect(structure).toBe(MOCK_RESPONSE_1_PROCESSED)
})
