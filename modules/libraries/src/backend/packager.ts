import fse from 'fs-extra'
import path from 'path'
import tmp from 'tmp'

import { bpLogger } from '.'
import { executeNpm } from './utils'

interface Package {
  name: string
  scripts: { [scriptName: string]: string }
  dependencies: { [scriptName: string]: string }
  bundledDependencies: string[]
}

const debug = DEBUG('libraries').sub('packager')

const scriptsToDisable = ['publish', 'prepublish', 'postpublish']

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

const disableScripts = (pkg: Package) => {
  if (!pkg.scripts) {
    return
  }

  scriptsToDisable.forEach(script => {
    if (pkg.scripts[script]) {
      pkg.scripts[`_${script}`] = pkg.scripts[script]
      delete pkg.scripts[script]
    }
  })
}

const addBundledDeps = (pkg: Package) => {
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
    await fse.writeJson(tempPackageJson, emptyPackage)

    // Legacy bundling ensures the library's dependencies are inside the library folder
    const installResult = await executeNpm(['install', `${name}@${version}`, '--legacy-bundling'], tmpDir.name)
    debug('Temporary installation of the library ', { installResult })

    const pkg: Package = await fse.readJson(libPackageJson)
    addBundledDeps(pkg)
    disableScripts(pkg)

    await fse.writeJson(libPackageJson, pkg)

    const packResult = await executeNpm(['pack'], libFolder)
    debug('Temporary packaging of the library ', { packResult })

    const archiveName = (await fse.readdir(libFolder)).find(x => x.endsWith('.tgz'))
    return await fse.readFile(path.join(libFolder, archiveName))
  } catch (err) {
    bpLogger.attachError(err).error('Error while trying to package the library')
  } finally {
    tmpDir.removeCallback()
  }
}
