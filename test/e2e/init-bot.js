const path = require('path')
const _    = require('lodash')
const ncp  = require('ncp').ncp
const fs   = require('fs')

const botData = require('./bot-data.json')

const INIT_TEMPLATE_DIR     = path.join(__dirname, '../../lib/cli/templates/init')
const BOT_DIR               = path.join(__dirname, './bot')
const BOT_PACKAGE_JSON_PATH = path.join(BOT_DIR, 'package.json')

ncp(INIT_TEMPLATE_DIR, BOT_DIR, function (err) {
    if (err)
        throw err

    const templateContent = fs.readFileSync(BOT_PACKAGE_JSON_PATH)
    const template        = _.template(templateContent)
    const compiled        = template(botData)

    fs.writeFileSync(BOT_PACKAGE_JSON_PATH, compiled)
})
