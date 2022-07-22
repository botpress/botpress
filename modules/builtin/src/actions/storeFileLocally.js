const axios = require('axios')
const FormData = require('form-data')
const uuidv4 = require('uuid').v4
const path = require('path')
const ms = require('ms')

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition#syntax
// Content-disposition header looks like this: Content-Disposition: attachment; filename="filename.ext"
// so we try extracting the filename from it
const extractFilenameFromHeader = headers => {
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

const extractFilenameFromURL = url => {
  // Removes the query params if there are any
  // E.g. https://blablabla.com/blabla/bla.mp4?bla=blablabla becomes https://blablabla.com/blabla/bla.mp4
  const urlWithoutQueryParams = url.split('?')[0]
  // Extract the last part of the URL
  // E.g. https://blablabla.com/blabla/bla.mp4 becomes bla.mp4
  const filename = urlWithoutQueryParams.substring(urlWithoutQueryParams.lastIndexOf('/') + 1)

  if (!path.extname(filename)) {
    return undefined
  } else {
    return filename
  }
}

/**
 * Store File Locally
 *
 * _Note that the payload URL gets overridden with the one Botpress generates_
 * @title Store File Locally
 * @category Storage
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
    const TIMEOUT = ms('5s')

    bp.logger.debug('[StoreFileLocally] - Downloading file:', fileUrl)

    // Timeout will not work if the server never reply or is very very slow to respond.
    // Which is the case with some API: https://github.com/axios/axios/issues/647
    const resp = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: TIMEOUT })

    bp.logger.debug('[StoreFileLocally] - File downloaded successfully!')

    let filename =
      extractFilenameFromURL(fileUrl) ||
      extractFilenameFromHeader(resp.headers) ||
      event.payload.title ||
      event.payload.caption ||
      uuidv4()

    // If the file does not have an extension, we imply that it's a binary file
    if (!path.extname(filename)) {
      filename = `${filename}.bin`
    }

    const formData = new FormData()
    formData.append('file', Buffer.from(resp.data.buffer), filename)

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true, studioUrl: true })
    axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`
    axiosConfig.timeout = TIMEOUT
    axiosConfig.maxContentLength = Infinity
    axiosConfig.maxBodyLength = Infinity

    bp.logger.debug('[StoreFileLocally] - Storing the file using the Media Service...')

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

    bp.logger.error('[StoreFileLocally] - Error while storing the file:', message)
  }
}

return storeFileLocally()
