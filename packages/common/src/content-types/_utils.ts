import _ from 'lodash'
import path from 'path'
import url from 'url'

const isBpUrl = str => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/
  return re.test(str)
}

export default {
  formatURL: (baseUrl, url) => {
    return isBpUrl(url) ? `${baseUrl}${url}` : url
  },
  isUrl: str => {
    try {
      new url.URL(str)
      return true
    } catch {
      return false
    }
  },
  extractPayload: (type, data) => {
    // for channel renderers
    return {
      type,
      ..._.pickBy(_.omit(data, 'event', 'temp', 'user', 'session', 'bot', 'BOT_URL'), v => v !== undefined)
    }
  },
  extractFileName: file => {
    let fileName = path.basename(file)
    if (fileName.includes('-')) {
      fileName = fileName
        .split('-')
        .slice(1)
        .join('-')
    }

    return fileName
  }
}
