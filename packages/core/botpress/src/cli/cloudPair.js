import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { print } from '../util'
import _ from 'lodash'

const hostnameRegex = /^(http|https):\/\/(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])(:\d+)?$/gi

module.exports = async (token, options) => {
  const opts = options.opts()
  const projectPath = path.resolve('.')
  const endpoint = opts.endpoint

  if (!token || !token.length) {
    return print.error('Please provide a valid token. e.g. "botpress cloud-pair your-secret-token"')
  }

  if (!hostnameRegex.test(endpoint)) {
    return print.error(
      `Invalid endpoint: "${endpoint}". Endpoint must start with 'http' or 'https' and must not contain a trailing slash.`
    )
  }

  const filePath = path.resolve(projectPath, 'bp-cloud.json')

  if (fs.existsSync(filePath)) {
    return print.error(
      `This bot is already paired with Botpress Cloud. If you believe this is an error, delete this file and try again: "${filePath}"`
    )
  }

  const packagePath = path.resolve(projectPath, 'package.json')

  if (!fs.existsSync(packagePath)) {
    return print.error(`This does not look like a valid project root. Please run this command at the root of your bot.`)
  }

  const { name, description } = require(packagePath) // eslint-disable-line

  const pairUrl = `${endpoint}/api/pairing`

  try {
    const { data } = await axios.post(pairUrl, { token, name, description })

    const { botId, teamId } = data.payload

    const content = {
      botId,
      teamId,
      token,
      endpoint
    }

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8')
  } catch (err) {
    const message = _.get(err, 'response.data.message') || err.message || 'Unknown error'
    return print.error(`Failed to pair the bot: "${message}"`)
  }

  print.success('Bot paired successfully')
}
