const axios = require('axios')
const FormData = require('form-data')
const uuidv4 = require('uuid').v4

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#syntax
// Content-disposition header looks like this: Content-Disposition: attachment; filename="filename.ext"
// so we try extracting the filename from it
const parseFilenameFromHeader = headers => {
  if (!headers['content-disposition']) {
    return
  }

  const filename = headers['content-disposition'].split('filename=')

  // The header does not contain any filename
  if (filename[0] === headers['content-disposition'] || filename.length !== 2) {
    return
  }

  // Removes double quotes from the filename
  return filename[1].replace(/"/g, '')
}

/**
 * Store File Locally
 *
 * _Note that the payload URL gets overridden with the Botpress one_
 * @title Store File Locally
 * @category Channel Vonage
 * @author Botpress, Inc.
 */
const storeFileLocally = async () => {
  let prop
  if (event.payload.file) {
    prop = 'file'
  } else if (event.payload.image) {
    prop = 'image'
  } else if (event.payload.audio) {
    prop = 'audio'
  } else if (event.payload.video) {
    prop = 'video'
  }

  if (!prop) {
    return
  }

  const fileUrl = event.payload[prop]

  try {
    const resp = await axios.get(fileUrl, { responseType: 'arraybuffer' })

    const filename = parseFilenameFromHeader(resp.headers) || event.payload.title || event.payload.caption || uuidv4()

    const formData = new FormData()
    formData.append('file', Buffer.from(resp.data.buffer), filename)

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`

    const {
      data: { url }
    } = await axios.post('/media', formData, { ...axiosConfig })

    bp.logger.info('[StoreFileLocally] - File stored successfully:', url)
    event.payload[prop] = url
  } catch (err) {
    let message = err.message
    if (err.response) {
      message = err.response.data
    }

    bp.logger.error('[StoreFileLocally] - Error while storing the file', message)
  }
}

return storeFileLocally()
