import axios from 'axios'
import chalk from 'chalk'
import _ from 'lodash'

export default ({ url, authToken }) => {
  if (!url || !authToken) {
    console.log(chalk.red(`${chalk.bold('Error:')} parameters are not valid.`))
    return
  }

  url = url.replace(/\/+$/, '')
  _sync(url, authToken).catch(err => console.log(`${chalk.red(`Error: ${err}`)}`))
}

async function _sync(host, auth): Promise<void> {
  try {
    const options = { headers: { Authorization: `Bearer ${auth}` } }
    const { data } = await axios.get(`${host}/api/v1/admin/versioning/changes`, options)

    const prodChanges = _.flatten(data.map(x => x.changes))
    const useForce = process.argv.includes('--force')

    if (_.isEmpty(prodChanges) || useForce) {
      console.log(chalk.blue(`Syncing local changes to ${chalk.bold(host)}`))
      useForce && console.log(chalk.yellow('using --force'))

      await axios.post(`${host}/api/v1/admin/versioning/sync`, undefined, options)

      console.log(chalk.green('Successfully synced your local changes to the database!'))
    } else {
      console.log(formatHeader(host))
      console.log(formatProdChanges(prodChanges))
    }
  } catch (err) {
    throw Error(`Couldn't import, server responded with \n ${err.response.status} ${err.response.statusText}`)
  }
}

function formatHeader(host) {
  return `Out of sync!\nYou have changes on your database that aren't synced on your local file system.\n(Visit ${chalk.bold(
    `${host}/admin/server/version`
  )} to save changes back to your Source Control)\n(Use ${chalk.yellow(
    '--force'
  )} to overwrite the database files by your local files)\n`
}

function formatProdChanges(changes) {
  return `Production changes:\n\n${chalk.red('-', changes.join('\n- '))}\n`
}
