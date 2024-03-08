export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null
}
