import axios from 'axios'
import chalk from 'chalk'
import { spawnSync } from 'child_process'
import { centerText } from 'core/logger'
import { OBFUSCATED, print, SECRET_KEYS } from 'diag'
import dns from 'dns'
import fs from 'fs'
import fse from 'fs-extra'
import _ from 'lodash'
import os from 'os'
import path from 'path'
import { URL } from 'url'

export const obfuscateSecrets = item => {
  return _.reduce(
    item,
    (res, value: any, key: string) => {
      if (SECRET_KEYS.find(x => key.toLowerCase().includes(x))) {
        res[key] = OBFUSCATED
      } else if (!_.isArray(value) && _.isObject(value)) {
        res[key] = obfuscateSecrets(value)
      } else {
        res[key] = value
      }

      return res
    },
    {}
  )
}

export const printHeader = (text: string) =>
  print(`${os.EOL}${'='.repeat(100)}${os.EOL}||${centerText(text, 95, 1)}||${os.EOL}${'='.repeat(100)}`)

export const printSub = (text: string) => print(`${os.EOL}${text}${os.EOL}${'~'.repeat(100)}`)

export const printRow = (label: string, details: string) => print(`${`${label}:`.padEnd(40)} ${details}`)

export const printObject = (obj: any, includePasswords?: boolean) =>
  print(JSON.stringify(_.omit(includePasswords ? obj : obfuscateSecrets(obj), '$schema'), undefined, 2))

export const testWriteAccess = (label: string, folder: string) => {
  try {
    const file = path.resolve(process.PROJECT_LOCATION, folder, 'testwrite123')
    fs.writeFileSync(file, '')
    fs.unlinkSync(file)

    printRow(label, `${folder} (${chalk.green('writable')})`)
  } catch (err) {
    printRow(label, `${folder} (${chalk.red(`not writable: ${err}`)})`)
  }
}

export const dnsLookup = async (hostname: string) => {
  const timePromise = new Promise(() => {}).timeout(5000)
  const lookupPromise = new Promise((resolve, reject) => {
    dns.lookup(hostname, (err, res) => (err ? reject(err) : resolve(res)))
  })

  return Promise.race([timePromise, lookupPromise])
}

export const testWebsiteAccess = async (label: string, url: string) => {
  const start = Date.now()
  let ip
  try {
    ip = await dnsLookup(new URL(url).hostname)
    await axios.get(url)

    printRow(label, `${chalk.green('success')} (${Date.now() - start}ms)`)
  } catch (err) {
    printRow(label, `${chalk.red(`failure: ${err.message}`)} (${Date.now() - start}ms)`)
  }

  print(` - ${url} (${ip})\n`)
}

export const queryWebsite = async (url: string, headers?: any) => {
  const start = Date.now()
  try {
    await axios.get(url, { headers })
    return { url, success: true, delay: Date.now() - start }
  } catch (err) {
    return { url, success: false, delay: Date.now() - start, message: err.message, status: err.response?.status }
  }
}

export const testProcessAccess = async (label: string, url: string) => {
  const start = Date.now()
  let ip
  try {
    ip = await dnsLookup(new URL(url).hostname)
    await axios.get(url)

    printRow(label, `${chalk.green('success')} (${Date.now() - start}ms)`)
  } catch (err) {
    printRow(label, `${chalk.red(`failure: ${err.message}`)} (${Date.now() - start}ms)`)
  }

  print(` - ${url} (${ip})\n`)
}

export const wrapMethodCall = async (label: string, method: any) => {
  const start = Date.now()
  try {
    await method()
    printRow(label, `${chalk.green('success')} (${Date.now() - start}ms)`)
  } catch (err) {
    printRow(label, `${chalk.red(`failure: ${err.message}`)} (${Date.now() - start}ms)`)
  }
}

export const getToolVersion = async name => {
  try {
    const basePath = process.pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../')
    const toolPath = path.resolve(basePath, 'bin', process.distro.os === 'win32' ? `${name}.exe` : name)

    if (await fse.pathExists(toolPath)) {
      const child = spawnSync(`${toolPath}`, ['--version'])
      return child.stdout.toString().trim()
    } else {
      return 'Executable not found'
    }
  } catch (err) {
    return `Error checking version: ${err}`
  }
}
