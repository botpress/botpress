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

/**
 * Copies the [`botpress.d.ts`]{@see ../src/bp/sdk/botpress.d.ts} file to all the
 * modules individually.
 */
const copySdkDefinitions = () => {
  let stream = gulp.src(['src/bp/sdk/botpress.d.ts', 'src/typings/global.d.ts'])
  const modules = getAllModulesRoot()
  for (let m of modules) {
    const src = _.get(readModuleConfig(m), 'botpress.src', 'src')
    const dest = path.join(m, src)
    stream = stream.pipe(gulp.dest(dest)).pipe(print())
  }
  return stream
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
    ? `cross-env NODE_ENV=production yarn build --nomap`
    : 'yarn build'

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
    `cross-env ./node_modules/.bin/module-builder package -v --out ../../out/binaries/modules/%name%.tgz`,
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
  const modules = getAllModulesRoot()
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
  mkdirp.sync('out/binaries/modules')
  const modules = getAllModulesRoot()
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

const build = () => {
  return gulp.series([buildModuleBuilder, copySdkDefinitions, buildModules()])
}

const buildSdk = () => {
  return gulp.series([copySdkDefinitions])
}

const cleanModuleAssets = () => {
  const moduleName = _.last(process.argv)
  return gulp.src(`./out/bp/data/assets/modules/${moduleName}`, { allowEmpty: true }).pipe(rimraf())
}

const createModuleSymlink = () => {
  const moduleFolder = process.argv.includes('--internal') ? 'internal-modules' : 'modules'
  const moduleName = _.last(process.argv)
  return gulp
    .src(`./${moduleFolder}/${moduleName}/assets/`)
    .pipe(symlink(`./out/bp/data/assets/modules/${moduleName}/`, { type: 'dir' }))
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
        () => gulp.src(`./out/bp/data/assets/modules/${moduleName}`, { allowEmpty: true }).pipe(rimraf()),
        () =>
          gulp
            .src(`./${moduleFolder}/${moduleName}/assets/`)
            .pipe(symlink(`./out/bp/data/assets/modules/${moduleName}/`, { type: 'dir' }))
      )
    )

    return taskName
  })

  return gulp.series(tasks)
}

module.exports = {
  build,
  buildSdk,
  buildModules,
  packageModules,
  buildModuleBuilder,
  cleanModuleAssets,
  createModuleSymlink,
  createAllModulesSymlink
}
