import sdk from 'botpress/sdk'
import chalk from 'chalk'
import { centerText } from 'core/logger'
import _ from 'lodash'
import moment from 'moment'

interface BannerConfig {
  title: string
  version: string
  /** Length of the logger label */
  labelLength: number
  /** Length of the complete line */
  lineWidth: number
  logger: sdk.Logger
}

interface BuildMetadata {
  version: string
  date: number
  branch: string
}

export const showBanner = (config: BannerConfig) => {
  const { title, version, labelLength, lineWidth, logger } = config
  let buildMetadata

  try {
    const metadata: BuildMetadata = require('../../metadata.json')
    const builtFrom = process.pkg ? 'BIN' : 'SRC'
    const branchInfo = metadata.branch !== 'master' ? `/${metadata.branch}` : ''

    buildMetadata = `Build ${moment(metadata.date).format('YYYYMMDD-HHmm')}_${builtFrom}${branchInfo}`
  } catch (err) {}

  const os = process.distro ? `OS: ${process.distro}` : undefined
  const infos = [`Version ${version}`, buildMetadata, os].filter(x => x !== undefined)
  const border = _.repeat('=', lineWidth)

  logger.info(`${border}
${chalk.bold(centerText(title, lineWidth, labelLength))}
${chalk.gray(centerText(infos.join(' - '), lineWidth, labelLength))}
${_.repeat(' ', labelLength)}${border}`)
}
