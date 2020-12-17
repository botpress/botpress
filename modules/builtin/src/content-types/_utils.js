const URL = require("url").URL;

function isBpUrl(str) {
  let re = /\/api\/.*\/bots\/.*\/media\/.*/i

  re.test(str)
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

module.exports = { 
  formatURL: formatURL,
  isUrl: isUrl
}
