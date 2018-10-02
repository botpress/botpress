import { exec } from 'child_process'
import fs from 'fs'
import glob from 'glob'
import path from 'path'
import rimraf from 'rimraf'
import { promisify } from 'util'
import yazl from 'yazl'

import { debug, error, normal } from './log'

const execAsync = promisify(exec)

export default async (argv: any) => {
  const modulePath = path.resolve(argv.path || process.cwd())

  try {
    await installProductionDeps(modulePath)
    await zipFiles(modulePath)
  } catch (err) {
    return error(`Error packaging module: ${err.message || ''} ${err.cmd || ''} ${err.stderr || ''}`)
  } finally {
    await cleanup(modulePath)
  }

  normal('Package completed')
}

async function installProductionDeps(modulePath) {
  debug('Installing production modules...')
  const { stdout } = await execAsync('yarn install --modules-folder node_production_modules --production', {
    cwd: modulePath
  })
  debug(stdout)
}

async function cleanup(modulePath) {
  debug('Cleaning up temporary files...')
  rimraf.sync(path.join(modulePath, 'node_production_modules'))
}

async function zipFiles(modulePath) {
  debug('Zipping files...')

  const packageJson = require(path.join(modulePath, 'package.json'))
  const outName = `${packageJson.name}_${packageJson.version}`.replace('@botpress/', '').replace(/\W/gi, '_') + '.zip'
  const outputFile = path.join(modulePath, outName)

  const files = glob.sync('**/*.*', {
    cwd: modulePath,
    ignore: ['node_modules/**', 'src/**']
  })

  const zip = new yazl.ZipFile()

  const promise = new Promise(resolve => {
    zip.outputStream.pipe(fs.createWriteStream(outputFile)).on('close', () => resolve())
  })

  for (const file of files) {
    zip.addFile(path.resolve(modulePath, file), file.replace(/^node_production_modules\//i, 'node_modules/'))
  }

  zip.end()

  return promise
}
