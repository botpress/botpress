require('bluebird-global')
const exec = require('child_process').exec
const archive = require('../../../../out/bp/core/misc/archive')
const fs = require('fs')
const rimraf = require('rimraf')
const path = require('path')
const glob = require('glob')
const semver = require('semver')
const _ = require('lodash')
const AWS = require('aws-sdk')
const chalk = require('chalk')
const core = require('@actions/core')
const yn = require('yn')

const start = async () => {
  const targetVersion = getMostRecentVersion()

  const Bucket = 'botpress-migrations'
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

  const dir = await Promise.fromCallback(cb => s3.listObjectsV2({ Bucket }, cb))
  for (const file of dir.Contents) {
    console.info(`Processing file ${file.Key}`)
    const [archiveName, version] = file.Key.split('_')

    const archiveVersion = version.replace(/.tgz|.zip/, '')
    const buffer = await Promise.fromCallback(cb => s3.getObject({ Bucket, Key: file.Key }, cb))
    console.log('read file')
    await prepareDataFolder(buffer.Body)
    console.log('data prepared')

    await testMigration(archiveName, archiveVersion, targetVersion, { isDown: false })
    await testMigration(archiveName, targetVersion, archiveVersion, { isDown: true })
  }
}

const prepareDataFolder = async buffer => {
  await Promise.fromCallback(cb => rimraf('./out/bp/data', cb))
  await archive.extractArchive(buffer, './out/bp/data')
  await restorePostgresDump()
}

const isPostgresDb = () => {
  return fs.existsSync(path.resolve('./out/bp/data/storage/postgres.dump'))
}

const restorePostgresDump = async () => {
  if (!isPostgresDb()) {
    return
  }

  const dbUrl = process.env.DATABASE_URL
  const dumpPath = path.resolve('./out/bp/data/storage/postgres.dump')

  console.log('Restoring Postgres dump file...')

  const dbName = dbUrl.substring(dbUrl.lastIndexOf('/') + 1)
  const urlWithoutDb = dbUrl.replace(`/${dbName}`, '')

  const res = await execute(`psql -tc "SELECT 'exists' FROM pg_database WHERE datname = '${dbName}'" ${urlWithoutDb}`)
  if (!res.includes('exists')) {
    await execute(`psql -c "CREATE DATABASE ${dbName}" ${urlWithoutDb}`)
  }

  await execute(`psql -f ${dumpPath} ${dbUrl}`)
}

const testMigration = async (botName, startVersion, targetVersion, { isDown }) => {
  console.log('test mig')
  const env = {
    DATABASE_URL: isPostgresDb() ? process.env.DATABASE_URL : undefined
  }
  await execute('node --version')
  await execute('yarn node --version')
  console.log(`yarn start migrate ${isDown ? 'down' : 'up'} --target ${targetVersion} --ignore-engines`)
  const result = await execute(
    `yarn start migrate ${isDown ? 'down' : 'up'} --target ${targetVersion} --ignore-engines`,
    './',
    env
  )
  const success = result.match(/Migration(s?) completed successfully/)
  const status = success ? chalk.green(`[SUCCESS]`) : chalk.red(`[FAILURE]`)
  const message = `${status} Migration ${isDown ? 'DOWN' : 'UP'} of ${botName} (${startVersion} -> ${targetVersion})`

  if (!success) {
    console.log(result)
    core.setFailed(message)
  } else {
    console.log(message)
  }
}

const getMostRecentVersion = () => {
  const coreMigrations = getMigrations('./out/bp')
  const modules = fs.readdirSync('./modules')

  const moduleMigrations = _.flatMap(modules, module => getMigrations(`./modules/${module}/dist`))
  const versions = [...coreMigrations, ...moduleMigrations].map(x => x.version).sort(semver.compare)

  return _.last(versions)
}

const getMigrations = rootPath => {
  return _.orderBy(
    glob.sync('migrations/*.js', { cwd: rootPath }).map(filepath => {
      const [rawVersion, timestamp, title] = path.basename(filepath).split('-')
      return {
        filename: path.basename(filepath),
        version: semver.valid(rawVersion.replace(/_/g, '.')),
        title: (title || '').replace(/\.js$/i, ''),
        date: Number(timestamp),
        location: path.join(rootPath, filepath)
      }
    }),
    'date'
  )
}

const execute = (cmd, cwd, env) => {
  const args = require('yargs')(process.argv).argv
  cwd = cwd || args.pgPath || __dirname
  env = env || process.env

  console.log(cwd, __dirname)
  const isVerbose = args.verbose

  return Promise.fromCallback(cb => {
    let outBuffer = ''
    const ctx = exec(cmd, { cwd, env }, err => cb(err, outBuffer))
    ctx.stdout.on('data', data => (outBuffer += data))

    if (isVerbose) {
      ctx.stdout.pipe(process.stdout)
      ctx.stderr.pipe(process.stderr)
    }
  })
}

start()
