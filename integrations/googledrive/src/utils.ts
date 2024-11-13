import { Readable } from 'stream'

export const streamToBuffer = (stream: Readable, maxBufferSize: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunkArray: Uint8Array[] = []
    let currentSize = 0
    stream
      .on('data', (chunk: Uint8Array) => {
        currentSize += chunk.length
        if (currentSize > maxBufferSize) {
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
