import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'
import prompt from 'prompt'
import chalk from 'chalk'
import validUrl from 'valid-url'
import axios from 'axios'
import Confirm from 'prompt-confirm'
import mkdirp from 'mkdirp'
import os from 'os'
import get from 'lodash/get'

import util from '../util'

const AUTH_FILE = '.auth.json'

// TODO: this part replicates `start.js`, refactor later
const getDataDir = () => {
  const projectPath = path.resolve('.')

  const botfile = path.join(projectPath, 'botfile.js')
  if (!fs.existsSync(botfile)) {
    util.print.error(`(fatal) No ${chalk.bold('botfile.js')} file found at: ` + botfile)
    process.exit(1)
  }

  const bf = require(botfile)
  return util.getDataLocation(bf.dataDir, projectPath)
}

const getCloudAuthFile = () => path.join(os.homedir(), '.botpress', AUTH_FILE)
const getAuthFile = () => path.join(getDataDir(), AUTH_FILE)

const readJsonFile = file => {
  try {
    const json = fs.readFileSync(file, 'utf-8')
    return JSON.parse(json)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      util.print.warn(err.message || 'Unknown error', `while reading ${file}.`)
    }
  }
  return {}
}

const writeJsonFile = (file, content) => {
  mkdirp.sync(path.dirname(file))
  fs.writeFileSync(file, JSON.stringify(content, null, 2))
}

const readBotAuth = () => readJsonFile(getAuthFile())
const readCloudAuth = () => readJsonFile(getCloudAuthFile())
const writeBotAuth = auth => writeJsonFile(getAuthFile(), auth)
const writeCloudAuth = auth => writeJsonFile(getCloudAuthFile(), auth)

const AUTH_DISABLED = '[AUTH DISABLED]'

const refreshToken = async botUrl => {
  const auth = readBotAuth()
  const token = auth[botUrl]

  // this method is only called if the auth is enabled
  // in which case it doesn't make sense even to try refreshing the fake token
  // we might have saved before when the auth was disabled on this server
  if (!token || token === AUTH_DISABLED) {
    return
  }

  try {
    const response = await axios.request({
      url: `${botUrl}/api/auth/refresh_token`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  } catch (err) {
    return null
  }
}

const doRootLogin = async botUrl => {
  // try refreshing token before attempting the new login
  const token = await refreshToken(botUrl)
  if (token) {
    return { token, kind: 'refresh' }
  }

  const schema = {
    properties: {
      user: {
        description: chalk.white('User:'),
        required: true
      },
      password: {
        description: chalk.white('Password:'),
        hidden: true,
        required: true
      }
    }
  }

  prompt.message = ''
  prompt.delimiter = ''
  prompt.start()

  const { user, password } = await Promise.fromCallback(cb => prompt.get(schema, cb))
  const result = await axios.post(`${botUrl}/api/login`, { user, password })

  if (result.data.success) {
    return { token: result.data.token, kind: 'login' }
  }
  throw new Error(result.data.reason)
}

const doCloudLogin = async (botUrl, botInfo) => {
  const userAuthUrl = `${botInfo.endpoint}/me/cli`
  const loginUrl = `${botInfo.endpoint}/api/login/bot/${botInfo.botId}/${botInfo.botEnv}`

  const cloudAuth = readCloudAuth()

  if (!cloudAuth[botInfo.endpoint]) {
    const schema = {
      properties: {
        token: {
          description: chalk.white('API Token:'),
          required: true
        }
      }
    }

    prompt.message = `You need to authenticate using Botpress Cloud for this bot.\r\nPlease visit ${userAuthUrl} and copy/paste your API token here.\r\n`
    prompt.delimiter = ''
    prompt.start()
    const { token: apiToken } = await Promise.fromCallback(cb => prompt.get(schema, cb))

    if (!apiToken.startsWith('cli__')) {
      throw new Error('Invalid API Token, expected token starting with "cli__"')
    }

    cloudAuth[botInfo.endpoint] = apiToken
    writeCloudAuth(cloudAuth)
  }

  try {
    const authorization = `Bearer ${cloudAuth[botInfo.endpoint]}`
    const { data } = await axios.get(loginUrl, { headers: { authorization } })
    return { token: get(data, 'payload.token'), kind: 'refresh' }
  } catch (err) {
    delete cloudAuth[botInfo.endpoint]
    writeCloudAuth(cloudAuth)
    const msg = get(err, 'response.data.message') || err.message
    throw new Error('Could not authenticate to bot using Botpress Cloud, please try again. (' + msg + ')')
  }
}

const doLogin = async botUrl => {
  const res = await axios.get(`${botUrl}/api/auth/info`)

  const data = res.data || {}

  if (!data.type === 'none') {
    return { token: AUTH_DISABLED, kind: 'no-auth' }
  } else if (data.type === 'cloud') {
    return doCloudLogin(botUrl, data)
  } else if (data.type === 'root') {
    return doRootLogin(botUrl)
  } else {
    throw new Error('Unknown login type: ' + data.type)
  }
}

exports.login = async botUrl => {
  botUrl = botUrl.replace(/\/+$/, '')

  if (!validUrl.isUri(botUrl)) {
    util.print.error(`Doesn't look like valid URL: ${botUrl}`)
    return
  }

  try {
    const { token, kind } = await doLogin(botUrl)
    const auth = readBotAuth()
    auth[botUrl] = token
    writeBotAuth(auth)
    if (kind === 'login') {
      util.print.success(`Logged in successfully. Auth token saved in ${getAuthFile()}.`)
    } else if (kind === 'refresh') {
      util.print.success(`Auth token refreshed and saved in ${getAuthFile()}.`)
    } else if (kind === 'no-auth') {
      util.print.info(`Auth is disabled at ${botUrl}, no need to login.`)
    }
    return token
  } catch (err) {
    util.print.error(err.message || 'Unknown')
    return
  }
}

exports.logout = botUrl => {
  if (!botUrl) {
    new Confirm("You're about to delete all saved auth tokens in the current folder. Are you sure?")
      .run()
      .then(answer => {
        if (!answer) {
          return
        }
        writeBotAuth({})
        writeCloudAuth({})
      })

    return
  }

  botUrl = botUrl.replace(/\/+$/, '')
  const auth = readBotAuth()
  if (!auth[botUrl]) {
    util.print.warn(`No saved token for ${botUrl}, nothing to do.`)
    return
  }

  delete auth[botUrl]
  writeBotAuth(auth)
  util.print.success('Logged out successfully.')
}
