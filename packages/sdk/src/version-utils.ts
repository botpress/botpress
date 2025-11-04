import * as semver from 'semver'
import { InterfacePackage, IntegrationPackage } from '.'

type GenericPackage = InterfacePackage | IntegrationPackage

export function packageOfMajor<T extends GenericPackage>(pkg: T): T & { version: string } {
  const major = semver.major(pkg.version)
  return { ...pkg, version: `>=${major}.0.0 <${major + 1}.0.0` }
}

export function packageOfMinor<T extends GenericPackage>(pkg: T): T & { version: string } {
  const major = semver.major(pkg.version)
  const minor = semver.minor(pkg.version)
  return {
    ...pkg,
    version: `>=${major}.${minor}.0 <${major}.${minor + 1}.0`,
  }
}
