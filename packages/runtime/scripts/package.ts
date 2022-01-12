import 'bluebird-global'
import archiver from 'archiver'
import { exec, ExecException } from 'child_process'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

const systems = [
  {
    osName: 'win',
    platform: 'win32',
    binding: 'windows',
    tempBin: 'runtime-win.exe',
    binaryName: 'runtime.exe'
  },
  {
    osName: 'darwin',
    platform: 'darwin',
    binding: 'darwin',
    tempBin: 'runtime-macos',
    binaryName: 'runtime'
  },
  {
    osName: 'linux',
    platform: 'linux',
    binding: 'linux',
    tempBin: 'runtime-linux',
    binaryName: 'runtime'
  }
]

const zipArchive = async ({ osName, binding, tempBin, binaryName }) => {
  const basePath = '.'
  mkdirp.sync(`${basePath}/archives`)

  const version = fse.readJsonSync(path.resolve('package.json')).version.replace(/\./g, '_')
  const endFileName = `runtime-v${version}-${osName}-x64.zip`
  const output = fse.createWriteStream(path.resolve(`${basePath}/archives/${endFileName}`))

  console.info(basePath, path.resolve(`${basePath}/archives/${endFileName}`))

  const archive = archiver('zip')
  archive.pipe(output)
  archive.directory(`../../build/native-extensions/${binding}`, `bindings/${binding}`)
  archive.file(`${basePath}/binaries/${tempBin}`, { name: binaryName })

  await archive.finalize()
  console.info(`${endFileName}: ${archive.pointer()} bytes`)
}

const packageAll = async () => {
  try {
    await execAsync('cross-env pkg --options max_old_space_size=16384 --output ./binaries/runtime ./package.json', {
      cwd: path.resolve(__dirname, '..')
    })
  } catch (err) {
    if (err instanceof Error) {
      const error = err as ExecException
      console.error('Error running: ', error.cmd, '\nMessage: ', error['stderr'], err)
    }
  }

  await Promise.map(systems, x => zipArchive(x))
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
packageAll()
