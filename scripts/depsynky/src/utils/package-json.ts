import * as fs from 'fs'
import * as prettier from 'prettier'

namespace objects {
  export const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[]
}

export type PackageJson = {
  name: string
  version: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export const read = (filePath: string): PackageJson => {
  const strContent = fs.readFileSync(filePath, 'utf-8')
  const content = JSON.parse(strContent)
  return content
}

export const write = (filePath: string, content: PackageJson) => {
  let strContent = JSON.stringify(content, null, 2)
  strContent = prettier.format(strContent, { parser: 'json' })
  fs.writeFileSync(filePath, strContent)
}

export const update = (filePath: string, content: Partial<PackageJson>) => {
  const currentPackage = read(filePath)

  // this preserves the order of the keys
  const newPackage = objects.keys(currentPackage).reduce((acc, key) => {
    if (key in content) {
      return { ...acc, [key]: content[key] }
    }
    return acc
  }, currentPackage)

  write(filePath, newPackage)
}
