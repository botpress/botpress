import axios from 'axios'
import fse from 'fs-extra'
import { Readable } from 'stream'

export const downloadBin = async (url: string, destinationFile: string, progress: (p: number) => void) => {
  const { data, headers } = await axios.get(url, {
    responseType: 'stream'
  })

  const tmpPath = destinationFile + '.tmp'
  const stream = data as Readable
  const fileSize = parseInt(headers['content-length'])
  let downloadedSize = 0

  await fse.createFile(tmpPath)
  stream.pipe(fse.createWriteStream(tmpPath))

  return new Promise((resolve, reject) => {
    stream.on('error', async err => {
      await fse.unlink(tmpPath)
      reject(new Error(`model download failed: ${url}`))
    })

    stream.on('data', chunk => {
      downloadedSize += chunk.length
      progress(downloadedSize / fileSize)
    })

    stream.on('end', async () => {
      await fse.rename(tmpPath, destinationFile)
      resolve()
    })
  })
}
