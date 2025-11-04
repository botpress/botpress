import * as semver from 'semver'
import { InterfacePackage, IntegrationPackage, PluginPackage } from '.'

type GenericPackage = InterfacePackage | IntegrationPackage | PluginPackage

export function packageOfMajor<T extends GenericPackage>(pkg: T): T & { version: string } {
  return { ...pkg, version: `>=${semver.major(pkg.version)}.0.0 <${semver.major(pkg.version) + 1}.0.0` }
}

export function packageOfMinor<T extends GenericPackage>(pkg: T): T & { version: string } {
  const major = semver.major(pkg.version)
  const minor = semver.minor(pkg.version)
  return {
    ...pkg,
    version: `>=${major}.${minor}.0 <${major}.${minor + 1}.0`,
  }
}

export function packageOfExactVersion<T extends GenericPackage>(pkg: T): T & { version: string } {
  return { ...pkg, version: `${pkg.version}` }
}
