import Axios from 'axios'
import chalk from 'chalk'
import fs from 'fs'
import stream from 'stream'
import tar from 'tar'

const _log = console.log

const _extractToDir = async (archive, target) => {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target)
  }
  const buffStream = new stream.PassThrough()
  const tarWriteStream = tar.x({ sync: true, strict: true, cwd: target })

  buffStream.end(archive)
  buffStream.pipe(tarWriteStream)

  return new Promise((resolve, reject) => {
    tarWriteStream.on('end', resolve)
    tarWriteStream.on('error', reject)
  })
}

const _getPendingChanges = async (host: string, auth: string) => {
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
    throw Error(`Couldn't get changes, host responded \n ${err.response.status} ${err.response.statusText}`)
  }
}

const _pull = async (host: string, auth: string, dir: string) => {
  const changes = await _getPendingChanges(host, auth)
  return _extractToDir(changes, dir)
}

export default ({ host, auth, dir }) => {
  // Better param validation? (host is a valid url, auth valid jwt)
  if (!host || !auth || !dir) {
    _log(chalk.red(`${chalk.bold('Error:')} parameters are not valid, login to the host admin and head to the versioning tab.`))
    return
  }

  _log(chalk.blue(`Pulling pending changes from ${chalk.bold(host)}`))
  _pull(host, auth, dir)
    .then(() => {
      _log(chalk.green(`Successfully extracted changes from ${chalk.bold(host)} in ${chalk.bold(dir)}`))
    })
    .catch(err => {
      _log(chalk.red(err))
    })
}
