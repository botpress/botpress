import _ from 'lodash'
import oslib from 'os'
import pathlib from 'path'

export namespace posix {
  export type AbsolutePath = `/${string}`
  export const isPath = (path: string) => isAbsolutePath(path) || isRelativePath(path)
  export const isRelativePath = (path: string) => path.startsWith('./') || path.startsWith('../')
  export const isAbsolutePath = (path: string): path is AbsolutePath => pathlib.posix.isAbsolute(path)
}

export namespace win32 {
  export type AbsolutePath = `${string}:\\${string}` // C:\path
  export const isPath = (path: string) => isAbsolutePath(path) || isRelativePath(path)
  export const isRelativePath = (path: string) => path.startsWith('.\\') || path.startsWith('..\\')
  export const isAbsolutePath = (path: string): path is AbsolutePath => /^[a-zA-Z]:\\/.test(path) // bp cli does not allow omitting the drive letter
}

export type AbsolutePath = posix.AbsolutePath | win32.AbsolutePath
export const isPath = (path: string) => win32.isPath(path) || posix.isPath(path)
export const isPlatformSpecificPath = (path: string) =>
  oslib.platform() === 'win32' ? win32.isPath(path) : posix.isPath(path)
export const isPlatformSpecificAbsolutePath = (path: string): path is AbsolutePath =>
  oslib.platform() === 'win32' ? win32.isAbsolutePath(path) : posix.isAbsolutePath(path)

export const cwd = (): AbsolutePath => process.cwd() as AbsolutePath
export const join = (abs: AbsolutePath, ...paths: string[]): AbsolutePath => {
  const joined = pathlib.join(abs, ...paths)
  return pathlib.normalize(joined) as AbsolutePath
}

export const rmExtension = (filename: string) => filename.replace(/\.[^/.]+$/, '')

export const toUnix = (path: string) => path.split(pathlib.sep).join(pathlib.posix.sep)

export const toNormalizedPosixPath = (path: string) =>
  (path.startsWith('./') ? './' : '') + pathlib.posix.normalize(path.replaceAll(/\\/g, '/')).replace(/\/\.$/, '')

export const absoluteFrom = (rootdir: AbsolutePath, target: string): AbsolutePath => {
  if (isPlatformSpecificAbsolutePath(target)) {
    return target
  }
  return pathlib.join(rootdir, target) as AbsolutePath
}

export const relativeFrom = (rootdir: AbsolutePath, target: string) => {
  let absPath: string

  if (isPlatformSpecificAbsolutePath(target)) {
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
