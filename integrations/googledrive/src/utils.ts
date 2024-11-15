import { Readable } from 'stream'
import { ListItemsInput, ListItemsOutput } from './types'

export type ListFunction<T> = (input: ListItemsInput) => Promise<ListItemsOutput<T>>

export const streamToBuffer = (stream: Readable, maxBufferSize: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunkArray: Buffer[] = []
    let size = 0
    stream
      .on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > maxBufferSize) {
          reject(`Max buffer size exceeded while converting stream to buffer (${maxBufferSize})`)
        }
        chunkArray.push(chunk)
      })
      .on('end', () => {
        resolve(Buffer.concat(chunkArray))
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

export const listItemsAndProcess = async <T>(listFn: ListFunction<T>, processFn: (item: T) => Promise<void>) => {
  let nextToken: string | undefined = undefined
  do {
    const { items, meta } = await listFn({ nextToken })
    for (const item of items) {
      await processFn(item)
    }
    nextToken = meta.nextToken
  } while (nextToken)
}
