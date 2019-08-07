import axios from 'axios'
import chalk from 'chalk'
import _ from 'lodash'

export default ({ url, authToken }) => {
  if (!url || !authToken) {
    console.log(chalk.red(`${chalk.bold('Error:')} parameters are not valid.`))
    return
  }

  url = url.replace(/\/+$/, '')
  _status(url, authToken).catch(() =>
    console.log(`${chalk.red(`Error: Could not reach ${url}. Make sure the server is running.`)}`)
  )
}

async function _status(host, auth): Promise<void> {
  try {
    const options = { headers: { Authorization: `Bearer ${auth}` } }
    const { data: changes } = await axios.get(`${host}/api/v1/admin/versioning/changes`, options)

    const localChanges = _.flatten(changes.map(x => x.local))
    const prodChanges = _.flatten(changes.map(x => x.prod))

    console.log(`(Use "bp pull --token=${auth}" to replace your local environment with production)`)
    console.log(`(Use bp push --token=${auth}" to replace production with your local environment)`)
    console.log(formatLocalChanges(localChanges))
    console.log(formatProdChanges(prodChanges))
  } catch (err) {
    throw Error(`Couldn't import, server responded with \n ${err.response.status} ${err.response.statusText}`)
  }
}

function formatProdChanges(changes) {
  return `Production changes:\n\n${changes.join('\n')}\n`
}

function formatLocalChanges(changes) {
  return `Local changes:\n\n${changes.join('\n')}\n`
}
