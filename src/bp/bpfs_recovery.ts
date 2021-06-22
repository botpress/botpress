import 'bluebird-global'
import 'reflect-metadata'
// eslint-disable-next-line import/order
import './sdk/rewire'

import chalk from 'chalk'
import { container } from 'core/app/inversify/app.inversify'
import { GhostService } from 'core/bpfs'
import Database from 'core/database'
import { TYPES } from 'core/types'
import fs from 'fs'
import { mkdirpSync } from 'fs-extra'
import path from 'path'

export default async (argv, action) => {
  let ghost: GhostService | undefined
  let database: Database | undefined

  try {
    ghost = container.get<GhostService>(TYPES.GhostService)
    database = container.get<Database>(TYPES.Database)

    const useDbDriver = process.env.BPFS_STORAGE === 'database'

    await database.initialize()
    await ghost.initialize(useDbDriver)
  } catch (err) {
    console.error(chalk.red('Error during initialization'), err)
    return process.exit()
  }

  const { file, dest } = argv

  if (argv.list) {
    console.info(`Directory listing of ${path.join('data', argv.list)}
=========================================`)

    const files = await ghost.root().directoryListing(argv.list)
    files.forEach(file => console.info(chalk.green(` - ${file}`)))
    process.exit()
  }

  if (!file) {
    console.error(chalk.red('The --file parameter is required'))
    process.exit()
  }

  if (action === 'pullfile') {
    let rootFolder = path.dirname(file)
    const filename = path.basename(file)

    if (rootFolder.startsWith('data/')) {
      rootFolder = rootFolder.replace(/^data\//, '')
    }

    if (!(await ghost.root().fileExists(rootFolder, filename))) {
      console.error(chalk.red(`File "${file}" not found in the database.`))
      process.exit()
    }

    const fileBuffer = await ghost.root().readFileAsBuffer(rootFolder, filename)

    mkdirpSync(path.dirname(dest || file))
    fs.writeFileSync(dest || file, fileBuffer)

    console.info(chalk.green(`File "${filename}" saved at ${path.resolve(dest || file)}`))
  }

  if (action === 'pushfile') {
    if (!fs.existsSync(path.resolve(file))) {
      console.error(`File ${file} doesn't exist locally.`)
      process.exit()
    }

    const destFolder = path.dirname(dest || file)
    const destFile = path.basename(dest || file)

    await ghost.root().upsertFile(destFolder, destFile, fs.readFileSync(path.resolve(file), 'UTF-8'))
    console.info(chalk.green(`File "${file}" saved at ${path.join(destFolder, destFile)}`))
  }

  process.exit()
}
