import * as fs from 'fs'
import * as pathlib from 'path'
import * as prettier from 'prettier'
import * as objects from './objects'

export type PackageJson = {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const toFile = (packageDirPath: string) => pathlib.join(packageDirPath, 'package.json')

export const readPackage = (packageDirPath: string): PackageJson => {
  const packageFilePath = toFile(packageDirPath)
  const packageContent = fs.readFileSync(packageFilePath, 'utf-8')
  const packageJson = JSON.parse(packageContent)
  return packageJson
}

export const isPackage = (packageDirPath: string): boolean => {
  const packageFilePath = toFile(packageDirPath)
  return fs.existsSync(packageFilePath)
}

export const writePackage = (packageDirPath: string, pkg: PackageJson) => {
  const packageFilePath = toFile(packageDirPath)
  let content = JSON.stringify(pkg, null, 2)
  content = prettier.format(content, { parser: 'json' })
  fs.writeFileSync(packageFilePath, content)
}

export const updatePackage = (packageDirPath: string, pkg: Partial<PackageJson>) => {
  const packageFilePath = toFile(packageDirPath)
  const currentPackage = readPackage(packageFilePath)

  // this preserves the order of the keys
  const newPackage = objects.keys(currentPackage).reduce((acc, key) => {
    if (key in pkg) {
      return { ...acc, [key]: pkg[key] }
    }
    return acc
  }, currentPackage)

  writePackage(packageFilePath, newPackage)
}
