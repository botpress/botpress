import fse from 'fs-extra'
import path from 'path'
import tmp from 'tmp'

import { executeNpm } from './utils'

const debug = DEBUG('libraries').sub('packager')

const emptyPackage = {
  name: 'temp',
  version: '1.0.0',
  description: '',
  main: 'index.js',
  scripts: {},
  keywords: [],
  author: '',
  license: 'ISC'
}

const disableScripts = pkg => {
  if (!pkg.scripts) {
    return
  }

  pkg.scripts.forEach(script => {
    if (['publish', 'prepublish', 'postpublish'].includes(script) && pkg.scripts[script]) {
      pkg.scripts['_' + script] = pkg.scripts[script]
      delete pkg.scripts[script]
    }
  })
}

const addBundledDeps = pkg => {
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies)
  }
}

export const packageLibrary = async (name: string, version: string) => {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  const tempPackageJson = path.join(tmpDir.name, 'package.json')
  const libFolder = path.join(tmpDir.name, 'node_modules', name)
  const libPackageJson = path.join(libFolder, 'package.json')

  try {
    await fse.writeFile(tempPackageJson, JSON.stringify(emptyPackage, undefined, 2))

    // Legacy bundling ensures the library's dependencies are inside the library folder
    const installResult = await executeNpm(['install', name, '--legacy-bundling'], tmpDir.name)
    debug('Temporary installation of the library ', { installResult })

    const pkg = JSON.parse(await fse.readFile(libPackageJson, 'utf8'))
    addBundledDeps(pkg)
    disableScripts(pkg)

    await fse.writeFile(libPackageJson, JSON.stringify(pkg, undefined, 2))

    const packResult = await executeNpm(['pack'], libFolder)
    debug('Temporary packaging of the library ', { packResult })

    const archiveName = (await fse.readdir(libFolder)).find(x => x.endsWith('.tgz'))
    return await fse.readFile(path.join(libFolder, archiveName))
  } catch (err) {
    console.log(err)
  } finally {
    tmpDir.removeCallback()
  }
}
