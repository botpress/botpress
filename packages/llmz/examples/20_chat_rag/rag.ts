import type { Client } from '@botpress/client'
import { readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { loading } from '../utils/spinner'

export const RAG_TAG = 'rag-llmz-demo'

export async function uploadToRAG(client: Client, files: string[]) {
  loading(true, 'Uploading example documents...')
  try {
    // uploadFile upserts by key; there is no need to delete existing documents first.
    return await Promise.all(
      files.map((name) =>
        client.uploadFile({
          key: `llmz-examples/rag/${name}`,
          content: readFileSync(new URL(`./documents/${name}`, import.meta.url), 'utf8'),
          index: true,
          tags: { title: name, purpose: RAG_TAG },
        })
      )
    )
  } finally {
    loading(false)
  }
}

export async function waitUntilIndexed(client: Client, fileIds: string[], timeoutSeconds = 60) {
  loading(true, 'Waiting for indexing...')
  try {
    const deadline = Date.now() + timeoutSeconds * 1000
    while (Date.now() < deadline) {
      const files = await Promise.all(fileIds.map(async (id) => (await client.getFile({ id })).file))
      if (files.every((file) => file.status === 'indexing_completed')) return
      if (files.some((file) => file.status === 'indexing_failed' || file.status === 'upload_failed')) {
        throw new Error('An example document failed to index.')
      }
      await delay(1000)
    }
    throw new Error('Timed out waiting for example documents to index.')
  } finally {
    loading(false)
  }
}
