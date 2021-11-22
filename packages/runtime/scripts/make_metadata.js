const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')

require('bluebird-global')

const writeMetadata = async () => {
  const metadata = {
    version: require(path.join(__dirname, '../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error(`Couldn't get active branch`, err)
  }

  fs.writeFileSync('./dist/metadata.json', JSON.stringify(metadata, null, 2))
}

writeMetadata()
