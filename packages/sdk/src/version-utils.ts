import * as semver from 'semver'
import { InterfacePackage, IntegrationPackage, PluginPackage } from '..'

type GenericPackage = InterfacePackage | IntegrationPackage | PluginPackage

export function ofMajor(pkg: GenericPackage): { dep: GenericPackage & { version: string } } {
  return {
    dep: { ...pkg, version: `>=${semver.major(pkg.version)}.0.0 <${semver.major(pkg.version) + 1}.0.0` },
  }
}
