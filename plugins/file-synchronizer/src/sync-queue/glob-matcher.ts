import * as picomatch from 'picomatch'
import type * as models from '../../definitions/models'
import { MAX_FILE_SIZE_BYTES } from '../consts'
import * as bp from '.botpress'

type GlobMatcherProps = {
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>
  item: models.FolderItem
  itemPath: string
}

type GlobMatchResult =
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
    if (picomatch.isMatch(itemPath, pathGlobPattern)) {
      return {
        shouldBeIgnored: true,
        reason: 'matches-exclude-pattern',
      }
    }
  }

  let matchesButHasUnmetRequirements = false

  for (const {
    pathGlobPattern,
    maxSizeInBytes,
    modifiedAfter,
    applyOptionsToMatchedFiles,
  } of configuration.includeFiles) {
    if (!picomatch.isMatch(itemPath, pathGlobPattern)) {
      continue
    }

    const isFileWithUnmetRequirements =
      item.type === 'file' &&
      ((maxSizeInBytes !== undefined &&
        maxSizeInBytes > 0 &&
        item.sizeInBytes !== undefined &&
        item.sizeInBytes > maxSizeInBytes) ||
        (item.sizeInBytes !== undefined && item.sizeInBytes > MAX_FILE_SIZE_BYTES) ||
        (modifiedAfter !== undefined &&
          item.lastModifiedDate !== undefined &&
          new Date(item.lastModifiedDate) < new Date(modifiedAfter)))

    if (isFileWithUnmetRequirements) {
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
