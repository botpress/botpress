import { test, expect } from 'vitest'
import { InMemoryChatIdStore } from './in-memory-store'

test('id store should set by fid and get by id', async () => {
  const store = new InMemoryChatIdStore()
  const fid = 'fid'
  const id = 'id'
  await store.byFid.set(fid, id)
  expect(await store.byFid.get(fid)).toBe(id)
  expect(await store.byId.get(id)).toBe(fid)
})

test('id store should set by id and get by fid', async () => {
  const store = new InMemoryChatIdStore()
  const fid = 'fid'
  const id = 'id'
  await store.byId.set(id, fid)
  expect(await store.byId.get(id)).toBe(fid)
  expect(await store.byFid.get(fid)).toBe(id)
})

test('id store should delete by fid', async () => {
  const store = new InMemoryChatIdStore()
  const fid = 'fid'
  const id = 'id'
  await store.byFid.set(fid, id)
  await store.byFid.delete(fid)
  expect(await store.byFid.find(fid)).toBeUndefined()
  expect(await store.byId.find(id)).toBeUndefined()
})
