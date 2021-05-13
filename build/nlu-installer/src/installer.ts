import Bluebird from 'bluebird'
import cliProgress from 'cli-progress'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'
import { downloadBin } from './download'
import { UnsuportedOSError } from './errors'
import logger from './logger'
import { dotsToUnderscores, underscoresToDots } from './semver'

type PerOS<T> = Record<NodeJS.Platform, T>

const FILE_PATTERNS: Partial<PerOS<RegExp>> = {
  win32: /nlu-v(\d+_\d+_\d+)-win-x64\.exe/,
  darwin: /nlu-v(\d+_\d+_\d+)-darwin-x64/,
  linux: /nlu-v(\d+_\d+_\d+)-linux-x64/
}

const makeFileNamePerOS = (version: string): Partial<PerOS<string>> => {
  const versionUnderscore = dotsToUnderscores(version)
  return {
    win32: `nlu-v${versionUnderscore}-win-x64.exe`,
    darwin: `nlu-v${versionUnderscore}-darwin-x64`,
    linux: `nlu-v${versionUnderscore}-linux-x64`
  }
}

interface ArgV {
  config: string
  output: string
  platform: NodeJS.Platform
  force: boolean
}

const scanAndRemoveInvalidVersion = async (platform: NodeJS.Platform, outputDir: string, version: string) => {
  const binRegex = FILE_PATTERNS[platform]
  if (!binRegex) {
    throw new UnsuportedOSError(platform)
  }

  const wrongVersionBinaries = (await fse.readdir(outputDir)).filter(f => {
    const wholeMatch = binRegex.exec(f)
    return wholeMatch && wholeMatch[1] && underscoresToDots(wholeMatch[1]) !== version
  })

  if (!wrongVersionBinaries.length) {
    return
  }
  logger.info(
    `About to prune the following binaries as the target version is ${version}: [${wrongVersionBinaries.join(', ')}]`
  )
  return Bluebird.map(
    wrongVersionBinaries.map(f => path.join(outputDir, f)),
    f => fse.unlink(f)
  )
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
    throw new UnsuportedOSError(argv.platform)
  }

  mkdirp.sync(argv.output)
  await scanAndRemoveInvalidVersion(argv.platform, argv.output, version)

  const fileDownloadURL = `${downloadURL}/${fileName}`
  const destination = path.join(argv.output, fileName)

  const destinationFileExists = fse.existsSync(destination)
  if (destinationFileExists && !argv.force) {
    logger.info('binary executable file up to date. Nothing to download.')
    return
  } else if (destinationFileExists && argv.force) {
    logger.info('Overwriting currently installed binary.')
    await fse.unlink(destination)
  }

  logger.info(`About to download from ${fileDownloadURL}`)
  logger.info(`Output file is ${destination}`)

  const downloadProgressBar = new cliProgress.Bar({
    format: 'NLU binary executable Download: [{bar}] ({percentage}%), {duration}s',
    stream: process.stdout,
    noTTYOutput: true
  })
  downloadProgressBar.start(100, 0)

  try {
    await downloadBin(fileDownloadURL, destination, (p: number) => {
      downloadProgressBar.update(p * 100)
    })
    downloadProgressBar.update(100)
    await fse.chmod(destination, '766') // user: rwx, group: rw, others: rw
  } finally {
    downloadProgressBar.stop()
  }
}
