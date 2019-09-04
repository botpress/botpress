import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import './sdk/rewire'
// tslint:disable-next-line:ordered-imports
import './common/polyfills'

import chalk from 'chalk'
import { FatalError } from 'errors'
import fs from 'fs'
import { mkdirpSync } from 'fs-extra'
import path from 'path'
import 'reflect-metadata'
import { container } from './core/app.inversify'
import Database from './core/database'
import { GhostService } from './core/services'
import { TYPES } from './core/types'

export default async (argv, action) => {
  let ghost: GhostService | undefined
  let database: Database | undefined

  try {
    ghost = container.get<GhostService>(TYPES.GhostService)
    database = container.get<Database>(TYPES.Database)

    const { DATABASE_URL } = process.env

    const useDbDriver = process.env.BPFS_STORAGE === 'database'
    ghost.initialize(useDbDriver)

    const dbType = DATABASE_URL && DATABASE_URL.toLowerCase().startsWith('postgres') ? 'postgres' : 'sqlite'
    await database.initialize(dbType, DATABASE_URL)
  } catch (err) {
    console.error(chalk.red(`Error during initialization`), err)
    return process.exit()
  }

  const { file, dest } = argv

  if (argv.list) {
    console.log(`Directory listing of ${path.join('data', argv.list)}
=========================================`)

    const files = await ghost.root().directoryListing(argv.list)
    files.map(file => console.log(chalk.green(` - ${file}`)))
    process.exit()
  }

  if (!file) {
    console.error(chalk.red(`The --file parameter is required`))
    process.exit()
  }

  if (action === 'pulldb') {
    const rootFolder = path.dirname(file)
    const filename = path.basename(file)

    if (!(await ghost.root().fileExists(rootFolder, filename))) {
      console.error(chalk.red(`File "${file}" not found in the database.`))
      process.exit()
    }

    const fileBuffer = await ghost.root().readFileAsBuffer(rootFolder, filename)

    mkdirpSync(dest ? path.dirname(dest) : path.dirname(file))
    fs.writeFileSync(dest || file, fileBuffer)

    console.log(chalk.green(`File "${filename}" saved at ${path.resolve(dest || file)}`))
  }

  if (action === 'pushdb') {
    if (!fs.existsSync(path.resolve(file))) {
      console.error(`File ${file} doesn't exist locally.`)
      process.exit()
    }

    const destFolder = path.dirname(dest || file)
    const destFile = path.basename(dest || file)

    await ghost.root().upsertFile(destFolder, destFile, fs.readFileSync(path.resolve(file), 'UTF-8'))
    console.log(chalk.green(`File "${file}" saved at ${path.join(destFolder, destFile)}`))
  }

  process.exit()
}
