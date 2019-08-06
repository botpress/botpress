import axios from 'axios'
import chalk from 'chalk'
import _ from 'lodash'

export default ({ url, authToken }) => {
  if (!url || !authToken) {
    console.log(chalk.red(`${chalk.bold('Error:')} parameters are not valid.`))
    return
  }

  url = url.replace(/\/+$/, '')
  _push(url, authToken).catch(err => console.log(err))
}

async function _push(url, auth): Promise<void> {
  try {
    const options = { headers: { Authorization: `Bearer ${auth}` } }
    const { data } = await axios.get(`${url}/api/v1/admin/versioning/changes`, options)

    const local = _.flatten(data.map(d => d.local))
    const prod = _.flatten(data.map(d => d.prod))
    const force = process.argv.includes('--force')

    if (_.isEmpty(local)) {
      console.log("Exiting - you don't have any local changes")
      return
    }

    if (_.isEmpty(prod) || force) {
      console.log(chalk.blue(`Pushing local changes to ${chalk.bold(url)}`))
      force && console.log(chalk.yellow('Using --force'))
      await axios.post(`${url}/api/v1/admin/versioning/update`, undefined, options)
      console.log(chalk.green('🎉 Successfully pushed your local changes to the production environment!'))
    } else {
      console.log(
        `${chalk.red(
          '🚨 Out of sync!'
        )}\nYou have changes on your production environment that aren't synced on your local file system.\n\nProduction changes:\n${chalk.red(
          '-',
          prod.join('\n- ')
        )}`
      )
      console.log(`\n\nLocal changes:\n${chalk.green('+', local.join('\n+ '))}`)
      console.log(
        `\n\nVisit ${url}/admin/settings/version to save changes back to your Source Control or use ${chalk.yellow(
          '--force'
        )} to ${chalk.red('overwrite')} the production files.`
      )
    }
  } catch (err) {
    throw Error(`Couldn't import, server responded with \n ${err.response.status} ${err.response.statusText}`)
  }
}

// NOTE: not creating revisions when starting with PRODUCTION=true???
