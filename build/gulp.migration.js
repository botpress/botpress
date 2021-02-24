require('bluebird-global')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const exec = require('child_process').exec
const fse = require('fs-extra')
const glob = require('glob')
const tmp = require('tmp')
const dotenv = require('dotenv')

const dumpServerData = async () => {
  const args = require('yargs')(process.argv).argv

  const rootPath = args.path || './'
  const archiveName = args.name || 'test-migration'
  const pgBinPath = args.pgPath || __dirname

  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  const dataItems = await fse.readdir(path.resolve(rootPath, 'out/bp/data'))

  for (const item of dataItems.filter(x => x !== 'assets')) {
    console.log(item)
    await fse.copy(path.resolve(rootPath, 'out/bp/data', item), `${tmpDir.name}/${item}`)
  }

  try {
    mkdirp.sync(`${tmpDir.name}/storage`)
    await dumpPostgresData(`${tmpDir.name}/storage`, rootPath, pgBinPath)
  } catch (err) {
    console.error('Error:', err)

    console.error(`Could not dump the postgres database.
Postgres must be installed, and the tool pg_dump must be available on your PATH (use --pgPath to override it)
Please make sure that the credentials provided in DATABASE_URL are valid`)
    throw err
  }

  const files = await Promise.fromCallback(cb => glob('**/*', { cwd: tmpDir.name, nodir: true, dot: true }, cb))

  const { createArchive } = require(path.resolve(rootPath, 'out/bp/core/misc/archive'))

  const currentVersion = require(path.resolve(rootPath, 'package.json')).version
  const filename = await createArchive(`./${archiveName}_${currentVersion}.tgz`, tmpDir.name, files)

  console.log(`Complete server archive saved at ${path.join(__dirname, filename)}.`)
  tmpDir.removeCallback()
}

const dumpPostgresData = async (storagePath, rootPath, pgBinPath) => {
  let databaseUrl = process.env.DATABASE_URL

  if (fse.pathExistsSync(path.resolve(rootPath, 'out/bp/.env'))) {
    const dot = dotenv.config({ path: path.resolve(rootPath, 'out/bp/.env') })

    if (dot && dot.parsed.DATABASE_URL) {
      databaseUrl = dot.parsed.DATABASE_URL
    }
  }

  if (databaseUrl && databaseUrl.startsWith('postgres')) {
    console.info('Dumping Postgres database...')
    const dumpPath = path.join(storagePath, 'postgres.dump')

    await Promise.fromCallback(cb => {
      exec(`pg_dump -f ${dumpPath} ${databaseUrl}`, { cwd: pgBinPath }, err => cb(err))
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
  dumpServerData
}
