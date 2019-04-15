import Axios from 'axios'
import chalk from 'chalk'

import { extractArchive } from './core/misc/archive'

export default ({ url, authToken, targetDir }) => {
  if (!url || !authToken || !targetDir) {
    console.log(
      chalk.red(
        `${chalk.bold('Error:')} parameters are not valid, login to the host admin and head to the versioning tab.`
      )
    )
    return
  }

  console.log(chalk.blue(`Pulling pending changes from ${chalk.bold(url)}`))
  _pull(url, authToken, targetDir)
    .then(() => {
      console.log(chalk.green(`Successfully extracted changes from ${chalk.bold(url)} in ${chalk.bold(targetDir)}`))
    })
    .catch(err => {
      console.log(chalk.red(err))
    })
}

async function _pull(host: string, auth: string, dir: string) {
  const archive = await _fetchFullExport(host, auth)
  return extractArchive(archive, dir)
}

async function _fetchFullExport(host: string, auth: string) {
  const options = {
    headers: {
      Authorization: `Bearer ${auth}`
    },
    responseType: 'arraybuffer'
  }

  try {
    const { data } = await Axios.get(`${host}/api/v1/admin/versioning/export`, options)
    return data
  } catch (err) {
    throw Error(`Couldn't export, server responded with \n ${err.response.status} ${err.response.statusText}`)
  }
}
