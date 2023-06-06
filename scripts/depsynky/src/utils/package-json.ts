import * as fs from 'fs'
import * as prettier from 'prettier'
import * as objects from './objects'

export type PackageJson = {
  name: string
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export const read = (packageFilePath: string): PackageJson => {
  const packageContent = fs.readFileSync(packageFilePath, 'utf-8')
  const packageJson = JSON.parse(packageContent)
  return packageJson
}

export const write = (packageFilePath: string, pkg: PackageJson) => {
  let content = JSON.stringify(pkg, null, 2)
  content = prettier.format(content, { parser: 'json' })
  fs.writeFileSync(packageFilePath, content)
}

export const update = (packageFilePath: string, pkg: Partial<PackageJson>) => {
  const currentPackage = read(packageFilePath)

  // this preserves the order of the keys
  const newPackage = objects.keys(currentPackage).reduce((acc, key) => {
    if (key in pkg) {
      return { ...acc, [key]: pkg[key] }
    }
    return acc
  }, currentPackage)

  write(packageFilePath, newPackage)
}
