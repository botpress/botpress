import type { Client } from '@botpress/client'

import { join, resolve } from 'path'
import { readFileSync } from 'fs'
import { loading } from '../utils/spinner'

const readDocument = (file: string) => readFileSync(resolve(join('./20_chat_rag/documents/', file)), 'utf-8')

export const RAG_TAG = 'rag-llmz-demo'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function uploadToRAG(client: Client, files: string[]) {
  loading(true, 'Uploading documents to Botpress RAG...')

  await Promise.allSettled(
    files.map(async (file) => {
      await client
        .deleteFile({
          id: `knowledge/${file}`,
        })
        .then(() => wait(2000))
    })
  )

  await Promise.all(
    files.map((file) =>
      client
        .uploadFile({
          key: 'knowledge/' + file,
          content: readDocument(file),
          // Indexing the file for RAG
          index: true,
          tags: {
            title: file,
            purpose: RAG_TAG,
          },
        })
        .catch((error) => {
          throw new Error(`Failed to upload file ${file}: ${error?.message}`)
        })
    )
  )

  loading(false)
}

export async function waitUntilIndexed(client: Client, timeout_in_seconds: number = 60) {
  loading(true, 'Waiting for documents to be indexed...')
  // eslint-disable-next-line no-async-promise-executor
  await new Promise<void>(async (resolve, reject) => {
    for (let i = 0; i < timeout_in_seconds; i++) {
      await wait(1000)
      const files = await client.list.files({ tags: { purpose: RAG_TAG } }).collect()
      if (files.length > 0 && files.every((file) => file.status === 'indexing_completed')) {
        resolve()
        return
      } else if (files.some((file) => file.status === 'indexing_failed' || file.status === 'upload_failed')) {
        reject(new Error('Some files failed to index.'))
        return
      }
    }
    reject(new Error('Timeout waiting for files to be indexed.'))
  })
  loading(false)
}
