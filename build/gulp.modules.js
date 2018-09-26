const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const gulp = require('gulp')
const run = require('gulp-run')
const glob = require('glob')
const print = require('gulp-print').default

const cwd = path.join(__dirname, '../modules')

const getAllModulesRoot = () => {
  return glob
    .sync('**/package.json', {
      cwd,
      ignore: '**/node_modules/**'
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
  let stream = gulp.src('src/bp/sdk/botpress.d.ts')
  const modules = getAllModulesRoot()
  for (let m of modules) {
    const src = _.get(readModuleConfig(m), 'botpress.src', 'src')
    const dest = path.join(m, src)
    stream = stream.pipe(gulp.dest(dest)).pipe(print())
  }
  return stream
}

const buildModule = modulePath => {
  return gulp.src(modulePath, { allowEmpty: true }).pipe(
    run('yarn build', {
      cwd: modulePath
    })
  )
}

const buildModules = () => {
  const modules = getAllModulesRoot()
  const tasks = modules.map(m => {
    const config = readModuleConfig(m)
    const moduleName = _.get(config, 'name', 'Unknown')
    const taskName = `build-module ${moduleName}`
    gulp.task(taskName, () => {
      return buildModule(m)
    })
    return taskName
  })

  return gulp.parallel(tasks)
}

module.exports = { copySdkDefinitions, buildModules }
