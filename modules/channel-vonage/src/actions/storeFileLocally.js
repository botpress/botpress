const axios = require('axios')
const FormData = require('form-data')
const uuidv4 = require('uuid').v4

/**
 * Store File Locally
 * @title Store File Locally
 * @category Channel Vonage
 * @author Botpress, Inc.
 * @param {string} file - The URL of the file to store locally
 */
const storeFileLocally = async file => {
  if (!event.payload.url || !file) {
    return
  }

  try {
    const resp = await axios.get(file, { responseType: 'arraybuffer' })

    const filename =
      (resp.headers['content-disposition'] &&
        resp.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')) ||
      event.payload.title ||
      event.payload.caption ||
      uuidv4()

    const formData = new FormData()
    formData.append('file', Buffer.from(resp.data.buffer), filename)

    const axiosConfig = await bp.http.getAxiosConfigForBot(event.botId, { localUrl: true })
    axiosConfig.headers['Content-Type'] = `multipart/form-data; boundary=${formData.getBoundary()}`

    const {
      data: { url }
    } = await axios.post('/media', formData, { ...axiosConfig })

    bp.logger.info('[StoreFileLocally] - File stored successfully:', url)
    event.payload.url = url
  } catch (err) {
    let message = err.message
    if (err.response) {
      message = err.response.data
    }

    bp.logger.error('[StoreFileLocally] - Error while storing the file', message)
  }
}

return storeFileLocally(args.file)
