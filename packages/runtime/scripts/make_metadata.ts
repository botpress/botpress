import 'bluebird-global'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

const writeMetadata = async () => {
  const metadata = {
    version: require(path.join(__dirname, '../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch: string = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error("Couldn't get active branch", err)
  }

  fs.writeFileSync('./src/metadata.json', JSON.stringify(metadata, null, 2))
}

void writeMetadata()
