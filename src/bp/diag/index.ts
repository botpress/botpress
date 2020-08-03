import 'bluebird-global'
// tslint:disable-next-line:ordered-imports
import '../sdk/rewire'
// tslint:disable-next-line:ordered-imports

import { BotConfig } from 'botpress/sdk'

import { Workspace } from 'common/typings'
import { Db, Ghost } from 'core/app'

import fse from 'fs-extra'
import _ from 'lodash'

import { getOrCreate as redisFactory } from 'core/services/redis'
import os from 'os'
import path from 'path'
import stripAnsi from 'strip-ansi'

import {
  printHeader,
  printObject,
  printRow,
  printSub,
  testWebsiteAccess,
  testWriteAccess,
  wrapMethodCall
} from './utils'

export const OBFUSCATED = '***obfuscated***'
export const SECRET_KEYS = ['secret', 'pw', 'password', 'token', 'key', 'cert']
export const ENV_VARS = [
  'PORT',
  'DATABASE_URL',
  'DATABASE_POOL',
  'EXTERNAL_URL',
  'NODE_PATH',
  'NODE_ENV',
  'BPFS_STORAGE',
  'NATIVE_EXTENSIONS_DIR',
  'REDIS_URL',
  'PRO_ENABLED',
  'CLUSTER_ENABLED',
  'AUTO_MIGRATE',
  'REVERSE_PROXY',
  'APP_DATA_PATH',
  'USE_REDIS_STATE',
  'DISABLE_GLOBAL_SANDBOX',
  'DISABLE_BOT_SANDBOX',
  'DISABLE_TRANSITION_SANDBOX',
  'FORCE_TRAIN_ON_MOUNT',
  'VERBOSITY_LEVEL',
  'DEBUG',
  'PG_HOST',
  'PG_PORT',
  'DEBUG_LOGGER',
  'HOME',
  'APPDATA',
  'SKIP_MIGRATIONS',
  'MONITORING_INTERVAL',
  'REDIS_OPTIONS',
  'TZ',
  'LANG',
  'LC_ALL',
  'LC_TYPE',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY'
]

const PASSWORD_REGEX = new RegExp(/(.*):(.*)@(.*)/)

let includePasswords = false
let botpressConfig = undefined
let outputFile = undefined

export const print = (text: string) => {
  console.log(text)

  if (outputFile) {
    fse.appendFileSync(outputFile!, stripAnsi(text) + os.EOL, 'utf8')
  }
}

const printModulesConfig = async (botId?: string) => {
  const ghost = botId ? Ghost.forBot(botId) : Ghost.global()
  const configs = await ghost.directoryListing('config/', '*.json')

  await Promise.mapSeries(configs, async file => {
    printSub(`${botId ? `Bot ${botId}` : 'Global'} - Module ${path.basename(file, '.json')}`)
    printObject(await ghost.readFileAsObject<any>('./config', file), includePasswords)
  })
}

const printGeneralInfos = () => {
  printHeader('General')
  printRow('Botpress Version', process.BOTPRESS_VERSION)
  printRow('Node Version', process.version.substr(1))
  printRow('Running Binary', process.pkg ? 'Yes' : 'No')
  printRow('Enterprise', process.IS_PRO_AVAILABLE ? (process.IS_PRO_ENABLED ? 'Enabled' : 'Available') : 'Unavailable')
  printRow('Hostname', os.hostname())
  printRow(
    'Host Information',
    `${process.distro} with ${os.cpus().length} CPUs and ${_.round(os.totalmem() / (1024 * 1024 * 1024))} GB RAM`
  )

  testWriteAccess('Executable Location', process.PROJECT_LOCATION)
  testWriteAccess('Data Folder', path.resolve(process.PROJECT_LOCATION, 'data'))
  testWriteAccess('App Data Folder', process.APP_DATA_PATH)
}

const testConnectivity = async () => {
  printHeader('Connectivity ')

  await wrapMethodCall('Connecting to Database', async () => {
    await Db.initialize()
    printRow('Database Type', Db.knex.isLite ? 'SQLite' : 'Postgres')

    if ((await Db.knex.raw('select 1+1 as result')) === undefined) {
      throw new Error('Database error')
    }

    const useDbDriver = process.BPFS_STORAGE === 'database'
    await Ghost.initialize(useDbDriver)
  })

  if (process.env.CLUSTER_ENABLED && redisFactory) {
    await wrapMethodCall('Connecting to Redis', async () => {
      const client = redisFactory('commands')

      if ((await client.ping().timeout(1000)) !== 'PONG') {
        throw new Error('Server down')
      }
    })
  }
}

const testNetworkConnections = async () => {
  printHeader('Network Connections')

  const hosts = [
    {
      label: 'Google (external access)',
      url: 'https://google.com'
    },
    {
      label: 'Licensing Server',
      url: 'https://license.botpress.io/prices'
    }
  ]

  try {
    const nluConfig = await Ghost.global().readFileAsObject<any>('config/', 'nlu.json')
    const duckling = process.env.BP_MODULE_NLU_DUCKLINGURL || nluConfig?.ducklingURL
    const langServer = process.env.BP_MODULE_NLU_LANGUAGESOURCES || nluConfig?.languageSources?.[0]?.endpoint

    if (duckling) {
      hosts.push({ label: 'Duckling Server', url: duckling })
    }

    if (langServer) {
      hosts.push({ label: 'Language Server', url: `${langServer}/languages` })
    }
  } catch (err) {}

  await Promise.map(hosts, host => testWebsiteAccess(host.label, host.url))
}

const printDatabaseTables = async () => {
  let tables
  if (Db.knex.isLite) {
    tables = await Db.knex.raw("SELECT name FROM sqlite_master WHERE type='table'").then(res => res.map(x => x.name))
  } else {
    tables = await Db.knex('pg_catalog.pg_tables')
      .select('tablename')
      .where({ schemaname: 'public' })
      .then(res => res.map(x => x.tablename))
  }

  printHeader('Database Tables')
  print(tables.sort().join(', '))
}

const listEnvironmentVariables = () => {
  printHeader('Environment Variables')

  const env = [...ENV_VARS, ...Object.keys(process.env).filter(x => x.startsWith('BP_') || x.startsWith('EXPOSED_'))]

  env
    .sort()
    .filter(x => process.env[x] !== undefined)
    .map(key => {
      let value = process.env[key]!

      if (!includePasswords) {
        if (PASSWORD_REGEX.test(value)) {
          value = value.replace(PASSWORD_REGEX, `$1:${OBFUSCATED}@$3`)
        } else if (SECRET_KEYS.find(x => key.toLowerCase().includes(x))) {
          value = OBFUSCATED
        }
      }

      printRow(key, value)
    })
}

const printConfig = async () => {
  printHeader('Botpress Config')
  printObject(botpressConfig, includePasswords)

  printHeader('Module Configuration')
  await printModulesConfig()
}

const printBotsList = async () => {
  const workspaces = await Ghost.global().readFileAsObject<Workspace[]>('/', `workspaces.json`)
  const botIds = (await Ghost.bots().directoryListing('/', 'bot.config.json')).map(path.dirname)

  await Promise.mapSeries(botIds, async botId => {
    printHeader(`Bot "${botId}" (workspace: ${workspaces.find(x => x.bots.includes(botId))?.id})`)

    const botConfig = await Ghost.forBot(botId).readFileAsObject<BotConfig>('/', 'bot.config.json')
    printObject(botConfig, includePasswords)

    await printModulesConfig(botId)
  })
}

export default async function(options) {
  includePasswords = options.includePasswords
  outputFile = options.outputFile

  printGeneralInfos()
  listEnvironmentVariables()

  await testConnectivity()
  try {
    // Must be after the connectivity test, but before network connections so we have duckling/lang server urls
    botpressConfig = await Ghost.global().readFileAsObject<any>('/', 'botpress.config.json')
  } catch (err) {}

  await testNetworkConnections()

  if (options.config) {
    await printConfig()
    await printBotsList()
    await printDatabaseTables()
  }

  process.exit(0)
}
