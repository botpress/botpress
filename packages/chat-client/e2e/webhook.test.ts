import { expect, test } from 'vitest'
import _ from 'lodash'
import * as config from './config'
import * as chat from '../src'

const invalidApiUrl = config.get('API_URL') + '1234'

test('client throws if webhook id is incorrect', async () => {
  const client = new chat.Client({ apiUrl: invalidApiUrl })
  const userPromise = client.createUser({ id: 'invalid' })
  expect(userPromise).rejects.toThrow(chat.UnknownError)
})
