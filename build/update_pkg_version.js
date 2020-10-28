const fs = require('fs')
const os = require('os')

const content = JSON.parse(fs.readFileSync('build/package.pkg.json').toString())
content.version = require('../package.json').version

fs.writeFileSync('build/package.pkg.json', `${JSON.stringify(content, undefined, 2)}${os.EOL}`, 'UTF-8')
