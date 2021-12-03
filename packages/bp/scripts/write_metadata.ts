import 'bluebird-global'
import { exec } from 'child_process'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'

const writeMetadata = async () => {
  const bpDir = path.resolve(__dirname, '../')

  const metadata = {
    version: require(path.join(bpDir, '../../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch: string = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error("Couldn't get active branch", err)
  }

  const distDir = path.join(bpDir, '/dist')
  mkdirp.sync(distDir)
  fse.writeJSONSync(path.join(distDir, 'metadata.json'), metadata, { spaces: 2 })
}

void writeMetadata()
