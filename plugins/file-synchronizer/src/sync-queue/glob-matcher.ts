import * as picomatch from 'picomatch'
import type * as models from '../../definitions/models'
import * as bp from '.botpress'

export type GlobMatcherProps = {
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>
  item: models.FolderItem
  itemPath: string
}

export type GlobMatchResult =
  | {
      shouldBeIgnored: false
      shouldApplyOptions: Exclude<
        GlobMatcherProps['configuration']['includeFiles'][number]['applyOptionsToMatchedFiles'],
        undefined
      >
    }
  | {
      shouldBeIgnored: true
      reason: 'matches-exclude-pattern' | 'unmet-include-requirements' | 'does-not-match-any-pattern'
    }

export const matchItem = ({ configuration, item, itemPath }: GlobMatcherProps): GlobMatchResult => {
  for (const { pathGlobPattern } of configuration.excludeFiles) {
    if (!pathGlobPattern) {
      continue
    }

    if (picomatch.isMatch(itemPath, pathGlobPattern)) {
      return {
        shouldBeIgnored: true,
        reason: 'matches-exclude-pattern',
      }
    }
  }

  let matchesButHasUnmetRequirements = false

  for (const { pathGlobPattern, applyOptionsToMatchedFiles, ...requirements } of configuration.includeFiles) {
    if (!pathGlobPattern || !picomatch.isMatch(itemPath, pathGlobPattern)) {
      continue
    }

    if (_isFileWithUnmetRequirements(item, requirements)) {
      matchesButHasUnmetRequirements = true
      continue
    }

    return {
      shouldBeIgnored: false,
      shouldApplyOptions: applyOptionsToMatchedFiles ?? {},
    }
  }

  return {
    shouldBeIgnored: true,
    reason: matchesButHasUnmetRequirements ? 'unmet-include-requirements' : 'does-not-match-any-pattern',
  }
}

type FileRequirements = Omit<
  GlobMatcherProps['configuration']['includeFiles'][number],
  'pathGlobPattern' | 'applyOptionsToMatchedFiles'
>

const _isFileWithUnmetRequirements = (
  item: models.FolderItem,
  { maxSizeInBytes, modifiedAfter }: FileRequirements
): boolean => {
  if (item.type !== 'file') {
    return false
  }

  const exceedsUserDefinedMaxSize =
    maxSizeInBytes !== undefined &&
    maxSizeInBytes > 0 &&
    item.sizeInBytes !== undefined &&
    item.sizeInBytes > maxSizeInBytes

  const isItemOlderThanGivenDate =
    modifiedAfter !== undefined &&
    modifiedAfter.length > 0 &&
    item.lastModifiedDate !== undefined &&
    new Date(item.lastModifiedDate) < new Date(modifiedAfter)

  return exceedsUserDefinedMaxSize || isItemOlderThanGivenDate
}
