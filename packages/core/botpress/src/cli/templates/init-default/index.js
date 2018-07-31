const { Botpress } = require('botpress')

const bot = new Botpress({ botfile: require('./botfile.js') })
bot.start()

module.exports = require('./src/index')
