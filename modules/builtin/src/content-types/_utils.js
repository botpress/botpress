const URL = require('url').URL
const path = require('path')

function isBpUrl(str) {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/

  return re.test(str)
}

function isUrl(str) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function formatURL(baseUrl, url) {
  if (isBpUrl(url)) {
    return `${baseUrl}${url}`
  } else {
    return url
  }
}

function extractFileName(file) {
  let fileName = path.basename(file)
  if (fileName.includes('-')) {
    fileName = fileName
      .split('-')
      .slice(1)
      .join('-')
  }

  return fileName
}

function extractPayload(type, data) {
  const payload = {
    type,
    ...data
  }

  delete payload.event
  delete payload.temp
  delete payload.user
  delete payload.session
  delete payload.bot
  delete payload.BOT_URL

  return payload
}

module.exports = {
  formatURL: formatURL,
  isUrl: isUrl,
  extractPayload: extractPayload,
  extractFileName: extractFileName
}
