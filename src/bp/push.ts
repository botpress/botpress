import axios from 'axios'
import chalk from 'chalk'
import followRedirects from 'follow-redirects'
import fse from 'fs-extra'
import _ from 'lodash'
import path from 'path'

import { createArchiveFromFolder } from './core/misc/archive'
import { asBytes } from './core/misc/utils'
import { FileChanges } from './core/services'

// This is a dependency of axios, and sets the default body limit to 10mb. Need it to be higher
followRedirects.maxBodyLength = asBytes('100mb')

// If the push will cause one of these actions, then a force will be required
const blockingActions = ['del', 'edit']

export default ({ url, authToken, targetDir }) => {
  if (!url || !authToken) {
    return console.log(chalk.red(`${chalk.bold('Error:')} Missing parameters "url" or "authToken"`))
  }

  if (!targetDir || !fse.existsSync(path.resolve(targetDir))) {
    return console.log(chalk.red(`${chalk.bold('Error:')} Target directory is not valid: "${targetDir}"`))
  }

  url = url.replace(/\/+$/, '')
  _push(url, authToken, targetDir).catch(err => console.log(`${chalk.red(`Error: ${err}`)}`))
}

async function _push(serverUrl: string, authToken: string, targetDir: string): Promise<void> {
  try {
    const archive = await createArchiveFromFolder(targetDir, ['assets/**/*'])

    const options = {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/tar+gzip',
        'Content-Disposition': `attachment; filename=archive_${Date.now()}.tgz`,
        'Content-Length': archive.length
      }
    }

    const { data } = await axios.post(`${serverUrl}/api/v1/admin/versioning/changes`, archive, options)

    const prodChanges = _.flatten((data.changes as FileChanges).map(x => x.changes))
    const blockingChanges = prodChanges.filter(x => blockingActions.includes(x.action))

    const useForce = process.argv.includes('--force')

    if (_.isEmpty(blockingChanges) || useForce) {
      console.log(chalk.blue(`Pushing local changes to ${chalk.bold(serverUrl)}`))
      useForce && console.log(chalk.yellow('using --force'))

      await axios.post(`${serverUrl}/api/v1/admin/versioning/update`, archive, options)

      console.log(chalk.green('🎉 Successfully pushed your local changes to the production environment!'))
    } else {
      console.log(formatHeader(serverUrl))
      console.log(formatProdChanges(prodChanges))
    }
  } catch (err) {
    const error = err.response ? err.response.statusText : err.message
    throw Error(`Couldn't import, server responded with \n ${error}`)
  }
}

function formatHeader(host) {
  return `
🚨 Out of sync!
  You have changes on your file system that aren't synchronized on your production environment.

  (Visit ${chalk.bold(`${host}/admin/server/version`)} to pull changes on your file system)
  (Use ${chalk.yellow('--force')} to overwrite the production changes by the local changes)
`
}

const printLine = ({ action, path, add, del }) => {
  if (action === 'add') {
    return chalk.green(` + ${path}`)
  } else if (action === 'del') {
    return chalk.red(` - ${path}`)
  } else if (action === 'edit') {
    return ` o ${path} (${chalk.green('+' + add)} / -${chalk.red(del)})`
  }
}

function formatProdChanges(changes) {
  const lines = _.orderBy(changes, 'action')
    .map(printLine)
    .join('\n')

  return `Differences between your local changes (green) vs production (red):

${lines}
`
}
