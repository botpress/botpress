import fs from 'fs'
import path from 'path'
import os from 'os'
import Promise from 'bluebird'
import axios from 'axios'
import Confirm from 'prompt-confirm'
import username from 'username'
import prependFile from 'prepend-file'
import mapValues from 'lodash/mapValues'

import { print } from '../util'
import { REVISIONS_FILE_NAME } from '../ghost-content'

import { login } from './auth'

Promise.promisifyAll(fs)

const writeRevisions = async (revisionsFile, revisions) => {
  const user = await username()
  const host = os.hostname()
  let fullUser = [user, host].filter(Boolean).join('@')
  if (fullUser) {
    fullUser = ' by ' + fullUser
  }
  const preamble = `# Synced ${new Date().toISOString()}${fullUser}`

  return Promise.fromCallback(cb => {
    prependFile(revisionsFile, [preamble, ...revisions, ''].join('\n'), cb)
  })
}

const writeFile = folderPath => async ({ file, content, deleted }) => {
  const filePath = path.join(folderPath, file)

  if (!deleted) {
    return fs.writeFileAsync(filePath, content)
  }

  try {
    return await fs.unlinkAsync(filePath)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return Promise.resolve(true)
    }
    throw e
  }
}

const updateFolder = projectLocation => async ({ files, revisions, binary }, folder) => {
  const folderPath = path.join(projectLocation, folder)
  const revisionsFile = path.join(folderPath, REVISIONS_FILE_NAME)
  await writeRevisions(revisionsFile, revisions)

  if (binary) {
    files.forEach(data => {
      data.content = Buffer.from(data.content, 'base64')
    })
  }

  return Promise.each(files, writeFile(folderPath))
}

module.exports = async botUrl => {
  botUrl = botUrl.replace(/\/+$/, '')

  // This also implicitly ensures we're inside of the bot project directory, and validates the bot URL
  print.info(`Checking your login status with ${botUrl}...`)
  const token = await login(botUrl)
  if (!token) {
    print.warn('Login is required for this operation, exiting now.')
    return
  }

  let config
  try {
    const { data } = await axios.get(`${botUrl}/api/ghost_content/export`, {
      headers: {
        authorization: `Bearer ${token}`
      }
    })
    config = data
  } catch (err) {
    print.error(err.message || 'Unknown error', 'while fetching ghost content.')
    return
  }

  if (!config || !Object.keys(config).length) {
    print.info('No pending ghost revisions, nothing to be done here.')
    return
  }

  const confirm = await new Confirm(`
  Running this command will override any untracked / uncommitted changes to the corresponding content files.
  It is recommended that you use version control system (like git) and commit any changes before proceeding.
  Are you sure you want to continue?
  `).run()

  if (!confirm) {
    return
  }

  try {
    await Promise.props(mapValues(config, updateFolder(path.resolve('.'))))
    print.success(`
    All content synced successfully. You now need to redeploy your bot with the updated content to finish the sync procedure.
    If you're using version control system (like git) you should review the changes before committing.
    Please don't forget to include (commit, deploy) ${REVISIONS_FILE_NAME} file(s).
    `)
  } catch (err) {
    print.error(err.message || 'Unknown error', 'while applying ghost content.')
    print.error('Your content files may be in inconsistent state.')
    print.error('It is recommended to reset the changes (like git reset) and try again.')
  }
}
