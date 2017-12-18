const fs = require('fs')

if (fs.existsSync('.pro-mode')) {
  console.error('\n\x1b[31mError! .pro-mode file found!')
  console.error('Make sure you are not using package.json generated for pro-version!\x1b[0m')
  process.exit(1)
}
