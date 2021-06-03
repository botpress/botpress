import Bluebird from 'bluebird'
import cliProgress from 'cli-progress'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'
import { validateConfig } from './config'
import { downloadBin } from './download'
import { UnsuportedOSError } from './errors'
import logger from './logger'
import { dotsToUnderscores, underscoresToDots } from './semver'
import { ArgV } from './typings'

type PerOS<T> = Record<NodeJS.Platform, T>

const FILE_PATTERNS: Partial<PerOS<RegExp>> = {
  win32: /nlu-v(\d+_\d+_\d+)-win-x64\.exe/,
  darwin: /nlu-v(\d+_\d+_\d+)-darwin-x64/,
  linux: /nlu-v(\d+_\d+_\d+)-linux-x64/
}

const DOWNLOAD_URL = 'https://github.com/botpress/nlu/releases/download/'

const makeFileNamePerOS = (version: string): Partial<PerOS<string>> => {
  const versionUnderscore = dotsToUnderscores(version)
  return {
    win32: `nlu-v${versionUnderscore}-win-x64.exe`,
    darwin: `nlu-v${versionUnderscore}-darwin-x64`,
    linux: `nlu-v${versionUnderscore}-linux-x64`
  }
}

const removeConsecutiveSlashes = (url: string) => url.replace(/([^:]\/)\/+/g, '$1')

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

  let rawConfig: any | undefined
  try {
    rawConfig = (await fse.readJSON(argv.config)).nlu
  } catch (err) {
    throw new Error(`An error occured while parsing config file: ${err.message}`)
  }

  const { version: nluVersion } = validateConfig(rawConfig, argv)
  const fileName = makeFileNamePerOS(nluVersion)[argv.platform]

  if (!fileName) {
    throw new UnsuportedOSError(argv.platform)
  }

  mkdirp.sync(argv.output)
  await scanAndRemoveInvalidVersion(argv.platform, argv.output, nluVersion)

  const fileDownloadURL = removeConsecutiveSlashes(`${DOWNLOAD_URL}/v${nluVersion}/${fileName}`)
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
