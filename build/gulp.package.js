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

const output = './packages/bp/binaries'
const outputBp = `${output}/bp`
const options = 'max_old_space_size=16384'

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

  for (const file of glob.sync(`${basePath}/binaries/modules/*.tgz`)) {
    archive.file(file, { name: `modules/${path.basename(file)}` })
  }

  await archive.finalize()
  console.info(`${endFileName}: ${archive.pointer()} bytes`)
}

const fetchExternalBinaries = () => {
  systems.forEach(({ osName, platform }) =>
    execAsync(`yarn bpd init --output ${path.resolve(output, osName)} --platform ${platform}`)
  )
}

const packageAll = async () => {
  try {
    fetchExternalBinaries()

    await execAsync(`cross-env pkg --options ${options} --output ${outputBp} package.json`)
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  }

  await Promise.map(systems, x => zipArchive(x))
}

const packageApp = async () => {
  const target = getTargetOSNodeVersion()
  const platform = getTargetOSName().replace('windows', 'win32')

  try {
    await execAsync(`yarn bpd init --output ${output} --platform ${platform}`)
    await execAsync(`cross-env pkg --targets ${target} --options ${options} --output ${outputBp} package.json`)
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  }
}

const copyNativeExtensions = async () => {
  const outputBindings = `${output}/bindings`
  const osName = getTargetOSName()
  const files = [
    ...glob.sync('./build/native-extensions/*.node'),
    ...glob.sync('./node_modules/**/node-v64-*/*.node'),
    ...glob.sync(`./build/native-extensions/${osName}/**/*.node`)
  ]
  const isNativeExtension = file => file.indexOf(path.join('native-extensions', osName).replace('\\', '/')) > 0

  mkdirp.sync(outputBindings)

  for (const file of files) {
    let targetDir = outputBindings
    if (isNativeExtension(file)) {
      const dist = path.basename(path.dirname(file))
      targetDir = `${outputBindings}/${osName}/${dist}`

      mkdirp.sync(path.resolve(targetDir))
    }

    fs.copyFileSync(path.resolve(file), path.resolve(targetDir, path.basename(file)))
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
