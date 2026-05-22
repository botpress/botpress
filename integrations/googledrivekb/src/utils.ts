import { Readable } from 'stream'
import { ListItemsInput, ListItemsOutput } from './types'

export type ListFunction<T> = (input: ListItemsInput) => Promise<ListItemsOutput<T>>
export type ListItemsInputWithArgs<T> = ListItemsInput & {
  args?: T
}
export type ListFunctionWithArgs<T, U> = (input: ListItemsInputWithArgs<U>) => Promise<ListItemsOutput<T>>

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

export const listItemsAndProcess = async <T, U>(
  listFn: ListFunctionWithArgs<T, U>,
  processFn: (item: T) => Promise<void>,
  args?: U
) => {
  let nextToken: string | undefined = undefined
  do {
    const { items, meta } = await listFn({ nextToken, args })
    for (const item of items) {
      await processFn(item)
    }
    nextToken = meta.nextToken
  } while (nextToken)
}

export const listAllItems = async <T, U>(listFn: ListFunctionWithArgs<T, U>, args?: U): Promise<T[]> => {
  const items: T[] = []
  let nextToken: string | undefined = undefined
  do {
    const { items: currentItems, meta } = await listFn({ nextToken, args })
    items.push(...currentItems)
    nextToken = meta.nextToken
  } while (nextToken)
  return items
}
