import { http, HttpResponse, bypass } from 'msw'
import fs from 'node:fs'
import path from 'node:path'

// Load cached responses
const loadCache = () => {
  const cachePath = path.resolve(__dirname, '../data/cache.jsonl')
  if (!fs.existsSync(cachePath)) {
    return new Map()
  }

  const lines = fs.readFileSync(cachePath, 'utf-8').split(/\r?\n/).filter(Boolean)
  const cache = new Map<string, any>()

  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      const inputHash = fastHash(entry.input)
      cache.set(inputHash, entry.value)
    } catch {}
  }

  return cache
}

function fastHash(str: string): string {
  let hash = 0
  const input = typeof str === 'string' ? str : JSON.stringify(str)
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}

const cache = loadCache()

function stringifyWithSortedKeys(obj: any): string {
  function sortKeys(input: any): any {
    if (Array.isArray(input)) {
      return input.map(sortKeys)
    } else if (input && typeof input === 'object' && input.constructor === Object) {
      return Object.keys(input)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = sortKeys(input[key])
            return acc
          },
          {} as Record<string, any>
        )
    } else {
      return input
    }
  }

  return JSON.stringify(sortKeys(obj))
}

export const handlers = [
  // Mock all Botpress Cloud API requests using cache
  http.all(/^https:\/\/api\.botpress\.(cloud|dev)\/.*/, async ({ request }) => {
    // Build request key from method, URL, and body
    const method = request.method
    const url = request.url
    const body = request.method !== 'GET' ? await request.clone().text() : null
    const shouldCache = !url.includes('/tables') && !url.includes('/v1/admin/')

    const requestData = stringifyWithSortedKeys({
      method,
      url: url.toString().replace('.dev/', '.cloud/'), // Normalize dev/cloud URLs
      body: body ? JSON.parse(body) : null,
    })

    const hash = fastHash(requestData)

    // Check cache
    const cached = cache.get(hash)
    if (cached && shouldCache) {
      return HttpResponse.json(cached)
    }

    // Not in cache - fetch from real API
    try {
      // Use bypass to avoid infinite recursion
      const response = await fetch(bypass(request))

      const responseData = await response.json()

      // Cache the response
      if (shouldCache) {
        cache.set(hash, responseData)
        const cachePath = path.resolve(__dirname, '../data/cache.jsonl')
        fs.appendFileSync(
          cachePath,
          JSON.stringify({
            key: hash,
            input: requestData,
            value: responseData,
          }) + '\n'
        )
      }

      return HttpResponse.json(responseData, { status: response.status })
    } catch (error) {
      console.error('  ❌ Error fetching from real API:', error)
      return HttpResponse.json({ error: 'Failed to fetch from real API' }, { status: 500 })
    }
  }),
]
