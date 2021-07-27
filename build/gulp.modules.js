const yn = require('yn')
const exec = require('child_process').exec
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const glob = require('glob')
const print = require('gulp-print').default
const mkdirp = require('mkdirp')
const { symlink } = require('gulp')
const rimraf = require('gulp-rimraf')
const cwd = path.join(__dirname, '../', process.argv.includes('--internal') ? 'internal-modules' : 'modules')

const getAllModulesRoot = () => {
  return glob
    .sync('**/package.json', {
      cwd,
      ignore: ['**/node_modules/**', '**/node_production_modules/**']
    })
    .map(x => path.join(cwd, x))
    .map(x => path.dirname(x))
}

const readModuleConfig = modulePath => {
  const packagePath = path.join(modulePath, 'package.json')
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Module "${modulePath}" didn't have a package.json file at its root`)
  }
  return JSON.parse(fs.readFileSync(packagePath))
}

const getTargetOSConfig = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'win32'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'linux'
  } else {
    return 'darwin'
  }
}

const buildModule = (modulePath, cb) => {
  const targetOs = getTargetOSConfig()
  const linkCmd = process.env.LINK ? `&& yarn link "module-builder"` : ''
  const buildCommand = process.argv.find(x => x.toLowerCase() === '--prod')
    ? `cross-env NODE_ENV=production yarn build --nomap --fail-on-error`
    : 'yarn build --fail-on-error'

  exec(
    `cross-env npm_config_target_platform=${targetOs} yarn ${linkCmd} && ${buildCommand}`,
    { cwd: modulePath },
    (err, stdout, stderr) => {
      if (err) {
        console.error(
          `
=======================================
Error building module ${modulePath}
=======================================
Status: ${stderr}
Output: ${stdout}`
        )
        return cb(err)
      }
      cb()
    }
  )
}

const packageModule = (modulePath, cb) => {
  exec(
    `node ../../build/module-builder/bin/entry package -v --out ../../packages/bp/binaries/modules/%name%.tgz`,
    { cwd: modulePath },
    (err, stdout, stderr) => {
      if (err) {
        console.error(stderr)
        return cb(err)
      }
      console.log(stdout)
      cb()
    }
  )
}

const buildModuleBuilder = cb => {
  exec(`yarn && yarn build`, { cwd: 'build/module-builder' }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr)
      return cb(err)
    }
    console.log(stdout)
    cb()
  })
}

const buildModules = () => {
  const allModules = getAllModulesRoot()

  const command = process.argv[process.argv.length - 2]
  const moduleArgs = process.argv[process.argv.length - 1].split(',')

  let moduleFilter = m => true
  if (command === '--m') {
    moduleFilter = m => moduleArgs.includes(m)
  } else if (command === '--a') {
    // if command="--a nlu" we match nlu, nlu-testing and nlu-extras
    moduleFilter = m => moduleArgs.some(arg => !!m.match(new RegExp(`${arg}`)))
  }

  const modules = allModules.filter(m => moduleFilter(path.basename(m)))

  const tasks = modules.map(m => {
    const config = readModuleConfig(m)
    const moduleName = _.get(config, 'name', 'Unknown')
    const taskName = `build-module ${moduleName}`
    gulp.task(taskName, cb => {
      buildModule(m, cb)
    })
    return taskName
  })

  if (yn(process.env.GULP_PARALLEL)) {
    return gulp.parallel(tasks)
  }

  return gulp.series(tasks)
}

const packageModules = () => {
  mkdirp.sync('packages/bp/binaries/modules')
  const allModules = getAllModulesRoot()

  const command = process.argv[process.argv.length - 2]
  const moduleArgs = process.argv[process.argv.length - 1].split(',')

  let moduleFilter = m => true
  if (command === '--m') {
    moduleFilter = m => moduleArgs.includes(m)
  } else if (command === '--a') {
    // if command="--a nlu" we match nlu, nlu-testing and nlu-extras
    moduleFilter = m => moduleArgs.some(arg => !!m.match(new RegExp(`${arg}`)))
  }

  const modules = allModules.filter(m => moduleFilter(path.basename(m)))

  const tasks = modules.map(m => {
    const config = readModuleConfig(m)
    const moduleName = _.get(config, 'name', 'Unknown')
    const taskName = `package-module ${moduleName}`
    gulp.task(taskName, cb => {
      packageModule(m, cb)
    })
    return taskName
  })

  return gulp.series(tasks)
}

// Temporarily cleaning the sdk, otherwise local copies will generate an error
const cleanSdk = () => {
  return gulp.src(['./modules/*/src/global.d.ts', './modules/*/src/botpress.d.ts'], { allowEmpty: true }).pipe(rimraf())
}

const build = () => {
  return gulp.series([buildModuleBuilder, cleanSdk, buildModules()])
}

const cleanModuleAssets = () => {
  const moduleName = _.last(process.argv)
  return gulp.src(`./packages/bp/dist/data/assets/modules/${moduleName}`, { allowEmpty: true }).pipe(rimraf())
}

const createModuleSymlink = () => {
  const moduleFolder = process.argv.includes('--internal') ? 'internal-modules' : 'modules'
  const moduleName = _.last(process.argv)
  return gulp
    .src(`./${moduleFolder}/${moduleName}/assets/`)
    .pipe(symlink(`./packages/bp/dist/data/assets/modules/${moduleName}/`, { type: 'dir' }))
}

const createAllModulesSymlink = () => {
  const moduleFolder = process.argv.includes('--internal') ? 'internal-modules' : 'modules'
  const modules = getAllModulesRoot()

  const tasks = modules.map(m => {
    const moduleName = path.basename(m)
    const taskName = `dev-modules ${moduleName}`

    gulp.task(
      taskName,
      gulp.series(
        () => gulp.src(`./packages/bp/dist/data/assets/modules/${moduleName}`, { allowEmpty: true }).pipe(rimraf()),
        () =>
          gulp
            .src(`./${moduleFolder}/${moduleName}/assets/`)
            .pipe(symlink(`./packages/bp/dist/data/assets/modules/${moduleName}/`, { type: 'dir' }))
      )
    )

    return taskName
  })

  return gulp.series(tasks)
}

const watchModules = cb => {
  const allModuleNames = getAllModulesRoot().map(x => path.basename(x))
  const command = process.argv[process.argv.length - 2]
  const moduleArgs = process.argv[process.argv.length - 1].split(',')

  if (!['--m', '--a'].includes(command)) {
    console.error(`Argument missing. Use --m for specific modules, or --a for a partial match. 
Modules must be comma-separated.
Example: 'yarn watch:modules --m channel-web,nlu,qna' or 'yarn watch:modules --a web,qna,basic'`)
    return cb()
  }

  const modules =
    command === '--m'
      ? allModuleNames.filter(m => moduleArgs.includes(m))
      : allModuleNames.filter(m => moduleArgs.find(x => m.includes(x)))

  if (!modules.length) {
    console.error('No module found matching provided arguments')
    return cb()
  }

  console.log(`Watching Modules: ${modules.join(', ')}`)

  modules.forEach(moduleName => {
    try {
      gulp.src(`./packages/bp/dist/data/assets/modules/${moduleName}`, { allowEmpty: true }).pipe(rimraf())
      gulp
        .src(`./modules/${moduleName}/assets/`)
        .pipe(symlink(`./packages/bp/dist/data/assets/modules/${moduleName}/`, { type: 'dir' }))
    } catch (err) {
      console.log('Cant create symlink for', moduleName)
    }

    const watch = exec('yarn && yarn watch', { cwd: `modules/${moduleName}` }, err => cb(err))
    watch.stdout.pipe(process.stdout)
    watch.stderr.pipe(process.stderr)
  })

  cb()
}

module.exports = {
  build,
  buildModules,
  watchModules,
  packageModules,
  buildModuleBuilder,
  cleanModuleAssets,
  createModuleSymlink,
  createAllModulesSymlink
}
