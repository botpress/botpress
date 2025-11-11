import * as semver from 'semver'
import { Package } from './package'
import { PluginDefinition } from './plugin/definition'

type GenericPackage = Exclude<Package, PluginDefinition>

/**
 * Returns the major version range for a given package.
 * Version utility helpers are only intended to be used with plugins.
 **/
export function allWithinMajorOf<T extends GenericPackage>(pkg: T): T & { version: string } {
  const major = semver.major(pkg.version)
  return { ...pkg, version: `>=${major}.0.0 <${major + 1}.0.0` }
}

/**
 * Returns the minor version range for a given package.
 * Version utility helpers are only intended to be used with plugins.
 **/
export function allWithinMinorOf<T extends GenericPackage>(pkg: T): T & { version: string } {
  const major = semver.major(pkg.version)
  const minor = semver.minor(pkg.version)
  return {
    ...pkg,
    version: `>=${major}.${minor}.0 <${major}.${minor + 1}.0`,
  }
}
