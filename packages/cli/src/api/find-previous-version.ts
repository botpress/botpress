import * as client from '@botpress/client'
import semver from 'semver'
import { NamePackageRef } from '../package-ref'
import * as paging from './paging'
import { IntegrationSummary } from './types'

export const findPreviousIntegrationVersion = async (
  client: client.Client,
  ref: NamePackageRef
): Promise<IntegrationSummary | undefined> => {
  const { name, version: targetVersion } = ref
  const allVersions = await paging.listAllPages(
    async ({ nextToken }) => client.listIntegrations({ name, nextToken }),
    (r) => r.integrations
  )

  const orderedVersions = allVersions.sort((a, b) => semver.compare(b.version, a.version))
  const latestVersion = orderedVersions[0]
  if (!latestVersion) {
    return
  }

  type VersionIdx = [number, IntegrationSummary]

  let current: VersionIdx = [0, latestVersion]
  while (semver.gte(current[1].version, targetVersion)) {
    const nextIdx = current[0] + 1
    const nextIntegration = orderedVersions[nextIdx]
    if (!nextIntegration) {
      break
    }
    current = [nextIdx, nextIntegration]
  }

  const previous = current[1]
  if (semver.gte(previous.version, targetVersion)) {
    return
  }

  return previous
}
