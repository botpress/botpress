import { expect, test } from 'vitest'
import * as notion from '../src/notion'
import { MOCK_RESPONSE_1, MOCK_RESPONSE_1_PROCESSED } from './notion.mock'

test('getDBStructure', () => {
  const structure = notion.getDbStructure(MOCK_RESPONSE_1)
  expect(structure).toBe(MOCK_RESPONSE_1_PROCESSED)
})
