import { Readable } from 'stream'

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
