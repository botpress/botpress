import { test, expect, vi } from 'vitest'
import { FSKeyValueCache } from './cache-utils'
import fs from 'fs'
import os from 'os'
import path from 'path'

type TestCache = {
  token?: string
  workspaceId?: string
  apiUrl?: string
}

test('cache should only read file once for multiple get calls', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheFile = path.join(tmpDir, 'test-cache.json')

  const initialData = {
    token: 'test-token',
    workspaceId: 'test-workspace',
    apiUrl: 'https://api.test.com',
  }
  fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2))

  const readFileSpy = vi.spyOn(fs.promises, 'readFile')

  const cache = new FSKeyValueCache<TestCache>(cacheFile)

  const token = await cache.get('token')
  const workspaceId = await cache.get('workspaceId')
  const apiUrl = await cache.get('apiUrl')

  expect(token).toBe('test-token')
  expect(workspaceId).toBe('test-workspace')
  expect(apiUrl).toBe('https://api.test.com')

  expect(readFileSpy).toHaveBeenCalledTimes(1)

  readFileSpy.mockRestore()
  fs.rmSync(tmpDir, { recursive: true })
})

test('cache should invalidate after set operation', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheFile = path.join(tmpDir, 'test-cache.json')

  const initialData = {
    token: 'old-token',
  }
  fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2))

  const cache = new FSKeyValueCache<TestCache>(cacheFile)

  const oldToken = await cache.get('token')
  expect(oldToken).toBe('old-token')

  await cache.set('token', 'new-token')

  const newToken = await cache.get('token')
  expect(newToken).toBe('new-token')

  fs.rmSync(tmpDir, { recursive: true })
})

test('cache should invalidate after rm operation', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheFile = path.join(tmpDir, 'test-cache.json')

  const initialData = {
    token: 'test-token',
    workspaceId: 'test-workspace',
  }
  fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2))

  const cache = new FSKeyValueCache<TestCache>(cacheFile)

  const token = await cache.get('token')
  expect(token).toBe('test-token')

  await cache.rm('token')

  const removedToken = await cache.get('token')
  expect(removedToken).toBeUndefined()

  const workspaceId = await cache.get('workspaceId')
  expect(workspaceId).toBe('test-workspace')

  fs.rmSync(tmpDir, { recursive: true })
})

test('cache should invalidate after clear operation', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheFile = path.join(tmpDir, 'test-cache.json')

  const initialData = {
    token: 'test-token',
    workspaceId: 'test-workspace',
  }
  fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2))

  const cache = new FSKeyValueCache<TestCache>(cacheFile)

  const token = await cache.get('token')
  expect(token).toBe('test-token')

  await cache.clear()

  const clearedToken = await cache.get('token')
  expect(clearedToken).toBeUndefined()

  fs.rmSync(tmpDir, { recursive: true })
})

test('cache should handle concurrent access from multiple instances', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-test-'))
  const cacheFile = path.join(tmpDir, 'test-cache.json')

  const initialData = {
    token: 'initial-token',
    workspaceId: 'initial-workspace',
    apiUrl: 'https://api.initial.com',
  }
  fs.writeFileSync(cacheFile, JSON.stringify(initialData, null, 2))

  const cache1 = new FSKeyValueCache<TestCache>(cacheFile)
  const cache2 = new FSKeyValueCache<TestCache>(cacheFile)
  const cache3 = new FSKeyValueCache<TestCache>(cacheFile)

  await Promise.all([
    (async () => {
      const token = await cache1.get('token')
      expect(token).toBe('initial-token')
      await cache1.set('token', 'token-from-cache1')
    })(),

    (async () => {
      const workspaceId = await cache2.get('workspaceId')
      expect(workspaceId).toBeDefined()
      await cache2.set('workspaceId', 'workspace-from-cache2')
    })(),

    (async () => {
      const apiUrl = await cache3.get('apiUrl')
      expect(apiUrl).toBeDefined()
      await cache3.set('apiUrl', 'https://api.from-cache3.com')
    })(),
  ])

  const cache4 = new FSKeyValueCache<TestCache>(cacheFile)

  const finalToken = await cache4.get('token')
  const finalWorkspace = await cache4.get('workspaceId')
  const finalApiUrl = await cache4.get('apiUrl')

  expect(finalToken).toBeDefined()
  expect(finalWorkspace).toBeDefined()
  expect(finalApiUrl).toBeDefined()

  const fileContent = fs.readFileSync(cacheFile, 'utf8')
  const parsedContent = JSON.parse(fileContent)
  expect(parsedContent).toBeDefined()
  expect(typeof parsedContent).toBe('object')

  fs.rmSync(tmpDir, { recursive: true })
})
