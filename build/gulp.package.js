const exec = require('child_process').exec
const path = require('path')
const fse = require('fs-extra')
const gulp = require('gulp')
const glob = require('glob')
const mkdirp = require('mkdirp')
const fs = require('fs')
const archiver = require('archiver')

const promisify = require('util').promisify
const execAsync = promisify(exec)

const systems = [
  {
    osName: 'win',
    platform: 'win32',
    binding: 'windows',
    tempBin: 'bp-win.exe',
    binaryName: 'bp.exe'
  },
  {
    osName: 'darwin',
    platform: 'darwin',
    binding: 'darwin',
    tempBin: 'bp-macos',
    binaryName: 'bp'
  },
  {
    osName: 'linux',
    platform: 'linux',
    binding: 'linux',
    tempBin: 'bp-linux',
    binaryName: 'bp'
  }
]

const getTargetOSNodeVersion = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'node12-win32-x64'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'node12-linux-x64'
  } else {
    return 'node12-macos-x64'
  }
}

const getTargetOSName = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'windows'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'linux'
  } else {
    return 'darwin'
  }
}

const zipArchive = async ({ osName, binding, tempBin, binaryName }) => {
  const basePath = 'packages/bp'
  mkdirp.sync(`${basePath}/archives`)

  const version = fse.readJsonSync(path.resolve('package.json')).version.replace(/\./g, '_')
  const endFileName = `botpress-v${version}-${osName}-x64.zip`
  const output = fse.createWriteStream(path.resolve(`${basePath}/archives/${endFileName}`))

  const archive = archiver('zip')
  archive.pipe(output)
  archive.directory(`${basePath}/binaries/${osName}/bin`, 'bin')
  archive.directory(`build/native-extensions/${binding}`, `bindings/${binding}`)
  archive.file(`${basePath}/binaries/${tempBin}`, { name: binaryName })
  if (osName === 'darwin') {
    archive.file('build/sorry.macos.txt', { name: 'sorry.txt' })
  }

  for (const file of glob.sync(`${basePath}/binaries/modules/*.tgz`)) {
    archive.file(file, { name: `modules/${path.basename(file)}` })
  }

  await archive.finalize()
  console.info(`${endFileName}: ${archive.pointer()} bytes`)
}

const makeTempPackage = () => {
  const additionalPackageJson = require(path.resolve(__dirname, './package.json'))
  const realPackageJson = require(path.resolve(__dirname, '../package.json'))
  const tempPkgPath = path.resolve(__dirname, '../packages/bp/dist/package.json')

  const packageJson = Object.assign(realPackageJson, additionalPackageJson)
  fse.writeJsonSync(tempPkgPath, packageJson, { spaces: 2 })

  return {
    remove: () => fse.unlinkSync(tempPkgPath)
  }
}

const fetchExternalBinaries = async () => {
  const binOut = path.resolve(__dirname, '../packages/bp/binaries')

  for (const { osName, platform } of systems) {
    // Since bpd does not exit when there is an error, we must read stderr to know if something went wrong
    const command = `yarn bpd init --output ${path.resolve(binOut, osName)} --platform ${platform}`
    const { stderr } = await execAsync(command)

    if (stderr) {
      const err = new Error()
      err.cmd = command
      err.stderr = stderr

      throw err
    }
  }
}

const packageAll = async () => {
  const tempPackage = makeTempPackage()

  try {
    await fetchExternalBinaries()

    await execAsync(`cross-env pkg --options max_old_space_size=16384 --output ../binaries/bp ./package.json`, {
      cwd: path.resolve(__dirname, '../packages/bp/dist')
    })
  } catch (err) {
    // We don´t want to create an archive if there was something wrong in the steps above
    console.error('Error running:', err.cmd, '\nMessage:', err.stderr)
    process.exit(1)
  } finally {
    tempPackage.remove()
  }

  await Promise.map(systems, x => zipArchive(x))
}

const packageApp = async () => {
  const tempPackage = makeTempPackage()

  const cwd = path.resolve(__dirname, '../packages/bp/dist')
  const binOut = path.resolve(__dirname, '../packages/bp/binaries')

  try {
    await execAsync(`yarn bpd init --output ${binOut} --platform ${getTargetOSName().replace('windows', 'win32')}`)
    await execAsync(
      `cross-env pkg --targets ${getTargetOSNodeVersion()} --options max_old_space_size=16384 --output ../binaries/bp ./package.json`,
      {
        cwd
      }
    )
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  } finally {
    tempPackage.remove()
  }
}

const copyNativeExtensions = async () => {
  const files = [
    ...glob.sync('./build/native-extensions/*.node'),
    ...glob.sync('./node_modules/**/node-v64-*/*.node'),
    ...glob.sync(`./build/native-extensions/${getTargetOSName()}/**/*.node`)
  ]

  mkdirp.sync('./packages/bp/binaries/bindings/')

  for (const file of files) {
    if (file.indexOf(path.join('native-extensions', getTargetOSName()).replace('\\', '/')) > 0) {
      const dist = path.basename(path.dirname(file))
      const targetDir = `./packages/bp/binaries/bindings/${getTargetOSName()}/${dist}`
      mkdirp.sync(path.resolve(targetDir))
      fs.copyFileSync(path.resolve(file), path.resolve(targetDir, path.basename(file)))
    } else {
      fs.copyFileSync(path.resolve(file), path.resolve('./packages/bp/binaries/bindings/', path.basename(file)))
    }
  }
}

const packageCore = () => {
  return gulp.series([copyNativeExtensions, packageApp])
}

const package = modules => {
  return gulp.series([
    package.packageApp,
    ...(process.argv.includes('--skip-modules') ? [] : modules),
    package.copyNativeExtensions
  ])
}

module.exports = {
  packageCore,
  packageApp,
  packageAll,
  copyNativeExtensions
}
