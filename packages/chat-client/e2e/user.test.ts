import { expect, test } from 'vitest'
import _ from 'lodash'
import * as utils from './utils'
import * as config from './config'
import * as chat from '../src'

const apiUrl = config.get('API_URL')

test('api prevents creating user with an invalid fid', async () => {
  const client = new chat.Client({ apiUrl })

  const userFid = utils.getUserFid()
  const invalidUserIds = [
    `invalid+${userFid}`, // invalid character
    `invalid_${userFid}_${userFid}_${userFid}_${userFid}`, // too long
  ]

  for (const id of invalidUserIds) {
    await expect(client.createUser({ id })).rejects.toThrow(chat.InvalidPayloadError)
  }

  for (const id of invalidUserIds) {
    const key = utils.getUserKey(id)
    await expect(client.getOrCreateUser({ 'x-user-key': key })).rejects.toThrow(chat.InvalidPayloadError)
  }
})

test('api prevents creating multiple users with the same foreign id', async () => {
  const client = new chat.Client({ apiUrl })

  const userFid = utils.getUserFid()

  const createUser = () =>
    client.createUser({
      id: userFid,
    })

  await createUser()
  await expect(createUser).rejects.toThrow(chat.AlreadyExistsError)
})

test('get or create user should create a user', async () => {
  const client = new chat.Client({ apiUrl })

  const userFid = utils.getUserFid()
  const userKey = utils.getUserKey(userFid)
  await client.getOrCreateUser({ 'x-user-key': userKey })

  const {
    user: { id: userId },
  } = await client.getOrCreateUser({ 'x-user-key': userKey })

  expect(userId).toBeDefined()
})

test('get or create user always returns the same user', async () => {
  const client = new chat.Client({ apiUrl })

  const { key: userKey } = await client.createUser({})

  const {
    user: { id: userId },
  } = await client.getUser({
    'x-user-key': userKey,
  })

  const getOrCreate = () =>
    client
      .getOrCreateUser({
        'x-user-key': userKey,
      })
      .then((r) => r.user.id)

  expect(await getOrCreate()).toBe(userId)
  expect(await getOrCreate()).toBe(userId) // operation is idempotent
})

test('get or create user with a fid always returns the same user', async () => {
  const client = new chat.Client({ apiUrl })

  const userFid = utils.getUserFid()
  const userKey = utils.getUserKey(userFid)
  await client.createUser({ id: userFid })

  const {
    user: { id: userId },
  } = await client.getUser({
    'x-user-key': userKey,
  })

  const getOrCreate = () =>
    client
      .getOrCreateUser({
        'x-user-key': userKey,
      })
      .then((r) => r.user.id)

  expect(await getOrCreate()).toBe(userId)
  expect(await getOrCreate()).toBe(userId) // operation is idempotent
})
