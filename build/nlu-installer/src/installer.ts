import cliProgress from 'cli-progress'
import fse from 'fs-extra'
import path from 'path'
import { downloadBin } from './download'
import logger from './logger'

type PerOS<T> = Record<NodeJS.Platform, T>

const makeFileNamePerOS = (version: string): Partial<PerOS<string>> => {
  const [major, minor, patch] = version.split('.')
  const versionUnderscore = `${major}_${minor}_${patch}`
  return {
    win32: `nlu-v${versionUnderscore}-win-x64.exe`,
    darwin: `nlu-v${versionUnderscore}-darwin-x64`,
    linux: `nlu-vd${versionUnderscore}-linux-x64`
  }
}

interface ArgV {
  config: string
  output: string
  platform: NodeJS.Platform
  force: boolean
}

export default async (argv: ArgV) => {
  const configFileExists = fse.existsSync(argv.config)
  if (!configFileExists) {
    throw new Error(`File ${argv.config} does not exist.`)
  }

  let nlu: any
  try {
    const fileContent = await fse.readFile(argv.config, 'utf8')
    const parsedContent = JSON.parse(fileContent)
    nlu = parsedContent.nlu
  } catch (err) {
    throw new Error(`An error occured while parsing config file: ${err.message}`)
  }

  if (!nlu) {
    throw new Error(`The config file ${argv.config} has no field "nlu"`)
  }

  const { version, downloadURL } = nlu
  const fileName = makeFileNamePerOS(version)[argv.platform]

  if (!fileName) {
    throw new Error(`Operating System ${argv.platform} no supported.`)
  }

  const fileDownloadURL = `${downloadURL}/${fileName}`
  const destination = path.join(argv.output, fileName)

  const destinationFileExists = fse.existsSync(destination)
  if (destinationFileExists && !argv.force) {
    logger.info('binary executable file up to date. Nothing to download.')
    return
  }

  logger.info(`About to download from ${fileDownloadURL}`)
  logger.info(`Output file is ${destination}`)

  const downloadProgressBar = new cliProgress.Bar({
    format: 'NLU binary executable Download: [{bar}] ({percentage}%), {duration}s',
    stream: process.stdout,
    noTTYOutput: true
  })
  downloadProgressBar.start(100, 0)

  await downloadBin(fileDownloadURL, destination, (p: number) => {
    downloadProgressBar.update(p * 100)
  })
  downloadProgressBar.update(100)
  downloadProgressBar.stop()

  await fse.chmod(destination, '766') // user: rwx, group: rw, others: rw
}
