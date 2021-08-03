module.exports = {
  copyFiles: [
    'src/botpress.d.ts',
    'src/typings/node.d.txt',
    'src/typings/es6include.txt',
    'src/typings/bot.config.schema.json',
    'src/typings/botpress.config.schema.json'
  ]
}

const fs = require('fs')
const path = require('path')

fs.mkdirSync('dist')
fs.copyFileSync(
  path.join(__dirname, '../../packages/bp/src/sdk/botpress.d.ts'),
  path.join(__dirname, 'dist/botpress.d.js')
)
