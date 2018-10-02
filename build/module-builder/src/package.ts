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
  const out = argv.out

  try {
    await installProductionDeps(modulePath)
    await zipFiles(modulePath, out)
  } catch (err) {
    return error(`Error packaging module: ${err.message || ''} ${err.cmd || ''} ${err.stderr || ''}`)
  } finally {
    await cleanup(modulePath)
  }

  normal('Package completed')
}

async function installProductionDeps(modulePath) {
  debug('Installing production modules...')
  const { stdout } = await execAsync(
    'yarn install --modules-folder node_production_modules --production --no-lockfile --ignore-scripts',
    {
      cwd: modulePath
    }
  )
  debug(stdout)
}

async function cleanup(modulePath) {
  debug('Cleaning up temporary files...')
  rimraf.sync(path.join(modulePath, 'node_production_modules'))
}

async function zipFiles(modulePath, outPath) {
  const packageJson = require(path.join(modulePath, 'package.json'))
  outPath = outPath.replace(/%name%/gi, packageJson.name.replace('@botpress/', '').replace(/\W/gi, '_'))
  outPath = outPath.replace(/%version%/gi, packageJson.version.replace(/\W/gi, '_'))

  if (!path.isAbsolute(outPath)) {
    outPath = path.join(modulePath, outPath)
  }

  debug(`Writing to "${outPath}"`)

  const files = glob.sync('**/*.*', {
    cwd: modulePath,
    nodir: true,
    ignore: ['node_modules/**', 'src/**']
  })

  debug(`Zipping ${files.length} files...`)

  const zip = new yazl.ZipFile()

  const promise = new Promise(resolve => {
    zip.outputStream.pipe(fs.createWriteStream(outPath)).on('close', () => resolve())
  })

  for (const file of files) {
    zip.addFile(path.resolve(modulePath, file), file.replace(/^node_production_modules\//i, 'node_modules/'))
  }

  zip.end()

  return promise
}
