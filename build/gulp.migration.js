require('bluebird-global')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const exec = require('child_process').exec
const fse = require('fs-extra')
const glob = require('glob')

const dotenv = require('dotenv')

const dumpMigration = async () => {
  const tmp = require('tmp')
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  fse.copySync('out/bp/data/global', `${tmpDir.name}/global`)
  fse.copySync('out/bp/data/bots', `${tmpDir.name}/bots`)
  fse.copySync('out/bp/data/storage', `${tmpDir.name}/storage`)

  try {
    await dumpPostgresData(`${tmpDir.name}/storage`)
  } catch (err) {
    console.error('Error:', err)

    console.error(`Could not dump the postgres database.
Postgres must be installed, and the tool pg_dump must be available on your PATH (use --pgPath to override it)
Please make sure that the credentials provided in DATABASE_URL are valid`)
    throw err
  }

  const files = await Promise.fromCallback(cb => glob('**/*', { cwd: tmpDir.name, nodir: true, dot: true }, cb))

  const currentVersion = require('../package.json').version
  const { createArchive } = require('../src/bp/core/misc/archive')
  const filename = await createArchive(`./test-migration_${currentVersion}.tgz`, tmpDir.name, files)

  console.log(`Archive saved at ${path.join(__dirname, filename)}. Please upload it on S3`)
  tmpDir.removeCallback()
}

const dumpPostgresData = async storagePath => {
  let databaseUrl = process.env.DATABASE_URL
  if (fse.pathExistsSync('./out/bp/.env')) {
    const dot = dotenv.config({ path: './out/bp/.env' })
    if (dot && dot.parsed.DATABASE_URL) {
      databaseUrl = dot.parsed.DATABASE_URL
    }
  }

  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    const args = require('yargs')(process.argv).argv
    const cwd = args.pgPath || __dirname

    const dumpPath = path.join(storagePath, 'postgres.dump')
    await Promise.fromCallback(cb => {
      const ctx = exec(`pg_dump -f ${dumpPath} ${databaseUrl}`, { cwd }, err => cb(err))
      ctx.stdout.on('data', data => (stdoutBuffer += data))
    })
  }
}

const createMigration = cb => {
  const args = require('yargs')(process.argv).argv
  if (!args.ver) {
    console.error('Version is required (set with --ver parameter')
    console.error('Example: yarn cmd migration:create --target core --ver 13.0.0 --title "some config update"')
    return cb()
  }

  const target = args.target || 'core'
  const version = args.ver.replace(/[ .]/g, '_').replace('v', '')
  const title = (args.title || '').replace(/[ .]/g, '_').toLowerCase()

  const template =
    target === 'core'
      ? path.resolve(__dirname, '../src/bp/core/services/migration/template_core.ts')
      : path.resolve(__dirname, '../src/bp/core/services/migration/template_module.ts')

  const targetDir =
    target === 'core'
      ? path.resolve(__dirname, '../src/bp/migrations')
      : path.resolve(__dirname, `../modules/${target}/src/migrations`)

  const destination = path.resolve(targetDir, `v${version}-${Math.round(Date.now() / 1000)}-${title}.ts`)
  mkdirp.sync(targetDir)
  fs.copyFileSync(template, destination)

  console.log('Migration file created at ' + destination)
  cb()
}

module.exports = {
  createMigration,
  dumpMigration
}
