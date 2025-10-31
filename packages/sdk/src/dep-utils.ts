import { Package } from './package'

export function depOfMajor(dep: Package) {
  return { ...dep, version: `>=${semver.major(hitl.version)}.0.0 <${semver.major(hitl.version) + 1}.0.0` }
}
