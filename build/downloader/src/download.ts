import axios from 'axios'
import fse from 'fs-extra'
import { Readable } from 'stream'

export const downloadFile = async (url: string, destinationFile: string, progress: (p: number) => void) => {
  const { data, headers } = await axios.get(url, { responseType: 'stream' })

  const tmpPath = destinationFile + '.tmp'
  const stream = data as Readable
  const fileSize = parseInt(headers['content-length'])
  let downloadedSize = 0

  await fse.createFile(tmpPath)
  stream.pipe(fse.createWriteStream(tmpPath))

  return new Promise((resolve, reject) => {
    stream.on('error', err => {
      fse.unlink(tmpPath, () => {
        reject(new Error(`file download failed with error: ${err.message}`))
      })
    })

    stream.on('data', chunk => {
      downloadedSize += chunk.length
      progress(downloadedSize / fileSize)
    })

    stream.on('end', () => {
      fse.rename(tmpPath, destinationFile, err => {
        if (err) {
          reject(err)
        }
        resolve(undefined)
      })
    })
  })
}
