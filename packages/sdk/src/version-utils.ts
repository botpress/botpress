import * as semver from 'semver'
import { InterfacePackage, IntegrationPackage, PluginPackage } from '.'

type GenericPackage = InterfacePackage | IntegrationPackage | PluginPackage

export function ofMajor<T extends GenericPackage>(pkg: T): T & { version: string } {
  return { ...pkg, version: `>=${semver.major(pkg.version)}.0.0 <${semver.major(pkg.version) + 1}.0.0` }
}
