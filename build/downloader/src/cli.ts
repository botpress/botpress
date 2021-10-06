import 'bluebird-global'
import chalk from 'chalk'
import { spawnSync } from 'child_process'
import cliProgress from 'cli-progress'
import fse from 'fs-extra'
import glob from 'glob'
import { CommonArgs } from 'index'
import moment from 'moment'
import path from 'path'
import rimraf from 'rimraf'
import yn from 'yn'
import { downloadFile } from './download'
import {
  getReleasedFiles,
  logger,
  APP_PREFIX,
  ProcessedRelease,
  sanitizeBranch,
  getBinaries,
  addFileToMetadata,
  readMetadataFile,
  saveMetadataFile
} from './utils'

export const toolsList = {
  nlu: {
    url: 'https://api.github.com/repos/botpress/nlu/releases'
  },
  studio: {
    url: 'https://api.github.com/repos/botpress/studio/releases'
  },
  messaging: {
    url: 'https://api.github.com/repos/botpress/messaging/releases'
  }
}

export const initProject = async (packageLocation: string, common: CommonArgs) => {
  if (!(await fse.pathExists(packageLocation))) {
    return logger.error(`Package.json not found at ${packageLocation}`)
  }

  const packageJson = await fse.readJson(packageLocation)
  for (const toolName of Object.keys(toolsList)) {
    if (!packageJson[toolName]) {
      logger.info(`Version missing for tool ${toolName} in package.json`)
      continue
    }

    let forceDownload = false
    let binaryInfo: ProcessedRelease | undefined
    const { version, devBranch } = packageJson[toolName]

    const releases = await getBinaries(toolName, common.platform, devBranch)
    const devRelease = devBranch && releases.find(x => x.version.endsWith(sanitizeBranch(devBranch)))

    if (devBranch && devRelease && !yn(process.env.IGNORE_DEV_BRANCH)) {
      logger.info(`Using the binary of branch "${devBranch}"`)
      binaryInfo = devRelease

      const existingFile = (await readMetadataFile(common.appData))?.[devRelease.fileName]

      if (existingFile?.fileId !== devRelease.fileId) {
        forceDownload = true
        logger.info('A new binary was published for that branch, re-downloading it...')
      }
    } else {
      binaryInfo = releases.find(x => x.version.endsWith(version))
    }

    if (!binaryInfo) {
      logger.info("Specified version not found on the tool's release page. Using existing binary.")
      continue
    }

    const location = path.resolve(common.appData, 'tools', toolName, binaryInfo.fileName)
    if ((await fse.pathExists(location)) && !forceDownload) {
      await useFile(toolName, binaryInfo.version, common)
    } else {
      await installFile(toolName, common, binaryInfo.version)
      await useFile(toolName, binaryInfo.version, common)
    }
  }
}

export const listFiles = async ({ platform, appData, output }: CommonArgs) => {
  const getToolVersion = async name => {
    const toolPath = path.resolve(output, 'bin', platform === 'win32' ? `${name}.exe` : name)

    try {
      if (await fse.pathExists(toolPath)) {
        const child = spawnSync(`${toolPath}`, ['--version'])
        return child.stdout.toString().trim()
      }
    } catch (err) {}
  }

  for (const toolName of Object.keys(toolsList)) {
    const activeVersion = await getToolVersion(toolName)
    const releases = await getReleasedFiles(toolName, platform)
    logger.info('')
    logger.info(`Available versions for "${toolName}"`)

    for (const release of releases) {
      const location = path.resolve(appData, 'tools', toolName, release.fileName)
      const isInstalled = await fse.pathExists(location)
      const isUsed = activeVersion && release.version.endsWith(activeVersion)

      logger.info(
        `  ${release.version} ${isInstalled ? '[installed]' : ''} ${isUsed ? '[currently used in this workspace]' : ''}`
      )
    }
  }

  logger.info('')
  logger.info('Type `yarn bpd init` to download & use binaries configured in package.json')
  logger.info('Type `yarn bpd install <toolName>` to install the latest version')
  logger.info('Type `yarn bpd use <toolName> <version>` to copy that specific version in the current workspace')
  logger.info('Type `yarn bpd clean` to remove all binaries')
}

export const cleanFiles = async (storageLocation: string) => {
  try {
    const folder = path.resolve(storageLocation, 'tools')
    await Promise.fromCallback(cb => rimraf(folder, cb))
    logger.info('Botpress Tools successfully removed')
  } catch (err) {
    logger.error(`Couldn't clean files ${err}`)
  }
}

export const cleanOutdatedBinaries = async ({ appData }: CommonArgs) => {
  const entries = await readMetadataFile(appData)
  if (!entries) {
    return
  }

  for (const fileName of Object.keys(entries)) {
    const { installDate } = entries[fileName]

    if (!installDate || moment().diff(moment(installDate), 'd') > 7) {
      const fileType = fileName.split('-')[0]
      const file = path.resolve(appData, 'tools', fileType, fileName)

      await fse.remove(file)
      delete entries[fileName]
    }
  }

  await saveMetadataFile(entries, appData)
}

export const installFile = async (toolName: string, common: CommonArgs, toolVersion?: string) => {
  if (!toolsList[toolName]) {
    return logger.error('Invalid tool name')
  }

  const releases = await getBinaries(toolName, common.platform, toolVersion)
  const release = !toolVersion ? releases[0] : releases.find(x => x.version.endsWith(toolVersion))

  if (!release) {
    return logger.error("Specified version doesn't exist.")
  }

  const { version, fileName, downloadUrl } = release
  const destination = path.resolve(common.appData, 'tools', toolName, fileName)

  logger.info(`Downloading file from ${downloadUrl}`)
  logger.info(`Output file is ${destination}`)

  const downloadProgressBar = new cliProgress.Bar({
    format: `${chalk.green(APP_PREFIX)} Downloading ${toolName} ${version}... [{bar}] ({percentage}%), {duration}s`,
    stream: process.stdout,
    noTTYOutput: true
  })
  downloadProgressBar.start(100, 0)

  try {
    await downloadFile(release.downloadUrl, destination, (p: number) => {
      downloadProgressBar.update(p * 100)
    })
    downloadProgressBar.update(100)
    await fse.chmod(destination, '766') // user: rwx, group: rw, others: rw
  } finally {
    downloadProgressBar.stop()
  }

  await addFileToMetadata(release, common.appData)
}

export const useFile = async (toolName: string, version: string, common: CommonArgs) => {
  const toolFolder = path.resolve(common.appData, 'tools', toolName)
  const underscoreVersion = version.replace(/[\W_]+/g, '_')

  const matchingFile = await Promise.fromCallback<string[]>(cb =>
    glob(`*${underscoreVersion}-${common.platform.replace('win32', 'win')}*`, { cwd: toolFolder }, cb)
  )

  if (!matchingFile.length) {
    return logger.error('Version not found')
  }
  const fileName = matchingFile[0]
  const srcFile = path.resolve(toolFolder, fileName)
  const destPath = path.resolve(common.output, 'bin', common.platform === 'win32' ? `${toolName}.exe` : toolName)

  if (await fse.pathExists(destPath)) {
    logger.info(`Removing existing binary at ${destPath}...`)
    await fse.unlink(destPath)
  }

  await fse.copy(srcFile, destPath)
  logger.info(`Now using ${fileName}`)
}
