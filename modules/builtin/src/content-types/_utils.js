const URL = require("url").URL;

function renderURL(data) {
  try {
    new URL(data.image)
    return data.image
  } catch {
    return `${data.BOT_URL}${data.image}`
  }
}

module.exports = { 
  renderURL: renderURL
 }
