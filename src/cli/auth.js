import fs from 'fs'
import path from 'path'
import Promise from 'bluebird'
import prompt from 'prompt'
import chalk from 'chalk'
import validUrl from 'valid-url'
import axios from 'axios'
import Confirm from 'prompt-confirm'

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

  // eslint-disable-next-line no-eval
  const bf = eval('require')(botfile)
  return util.getDataLocation(bf.dataDir, projectPath)
}

const getAuthFile = () => path.join(getDataDir(), AUTH_FILE)

const readAuth = () => {
  const authFile = getAuthFile()
  try {
    const json = fs.readFileSync(authFile, 'utf-8')
    return JSON.parse(json)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      util.print.warn(err.message || 'Unknown error', `while reading ${authFile}.`)
    }
  }
  return {}
}

const writeAuth = auth => {
  const authFile = getAuthFile()
  fs.writeFileSync(authFile, JSON.stringify(auth, null, 2))
}

const AUTH_DISABLED = '[AUTH DISABLED]'

const refreshToken = async botUrl => {
  const auth = readAuth()
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

const doLogin = async botUrl => {
  const res = await axios.get(`${botUrl}/api/auth/enabled`)
  if (res.data === false) {
    return { token: AUTH_DISABLED, kind: 'no-auth' }
  }

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

exports.login = async botUrl => {
  botUrl = botUrl.replace(/\/+$/, '')

  if (!validUrl.isUri(botUrl)) {
    util.print.error(`Doesn't look like valid URL: ${botUrl}`)
    return
  }

  try {
    const { token, kind } = await doLogin(botUrl)
    const auth = readAuth()
    auth[botUrl] = token
    writeAuth(auth)
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
        writeAuth({})
      })

    return
  }

  botUrl = botUrl.replace(/\/+$/, '')
  const auth = readAuth()
  if (!auth[botUrl]) {
    util.print.warn(`No saved token for ${botUrl}, nothing to do.`)
    return
  }

  delete auth[botUrl]
  writeAuth(auth)
  util.print.success('Logged out successfully.')
}
