import _ from 'lodash'
import pathlib from 'path'

export type AbsolutePath = `/${string}` | `C:\\${string}`

export const cwd = (): AbsolutePath => process.cwd() as AbsolutePath
export const isAbsolute = (path: string): path is AbsolutePath => pathlib.isAbsolute(path)
export const isPath = (path: string) => isAbsolute(path) || path.startsWith('.')
export const join = (abs: AbsolutePath, ...paths: string[]): AbsolutePath => {
  const joined = pathlib.join(abs, ...paths)
  return pathlib.normalize(joined) as AbsolutePath
}

export const rmExtension = (filename: string) => filename.replace(/\.[^/.]+$/, '')

export const toUnix = (path: string) => path.split(pathlib.sep).join(pathlib.posix.sep)

export const absoluteFrom = (rootdir: AbsolutePath, target: string): AbsolutePath => {
  if (isAbsolute(target)) {
    return target
  }
  return pathlib.join(rootdir, target) as AbsolutePath
}

export const relativeFrom = (rootdir: AbsolutePath, target: string) => {
  let absPath: string

  if (isAbsolute(target)) {
    absPath = target
  } else {
    absPath = pathlib.resolve(pathlib.join(rootdir, target))
  }

  return pathlib.relative(rootdir, absPath)
}

export class PathStore<P extends string> {
  public constructor(public readonly abs: Record<P, AbsolutePath>) {}
  public rel(from: Extract<P, `${string}Dir`>) {
    return _.mapValues(this.abs, (to) => relativeFrom(this.abs[from], to))
  }
}
