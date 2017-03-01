const path     = require('path')
const botpress = require('../../lib/botpress')

const bot = new botpress({ botfile: path.join(__dirname, './bot/botfile.js') })

bot.start()
