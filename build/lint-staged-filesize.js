const fs = require('fs')
const files = process.argv.slice(2)
const chalk = require('chalk')

const SIZE_LIMIT_MB = 30

const bytesToString = bytes => {
  const units = ['bytes', 'kb', 'mb', 'gb', 'tb']
  const power = Math.log2(bytes)
  const unitNumber = Math.min(Math.floor(power / 10), 4)
  const significand = bytes / Math.pow(2, unitNumber * 10)

  return `${significand.toFixed(0)} ${units[unitNumber]}`
}

const sizeLimit = SIZE_LIMIT_MB * 1024 * 1024

const overLimit = files.map(path => ({ path, size: fs.statSync(path).size })).filter(x => x.size > sizeLimit)

if (overLimit.length) {
  console.error(`\nSome files are over the size limit (${bytesToString(sizeLimit)}):`)
  overLimit.forEach(file => console.error(chalk.bold(`  * ${bytesToString(file.size)} ${file.path}`)))

  process.exit(1)
}
