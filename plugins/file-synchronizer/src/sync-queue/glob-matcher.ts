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
    const isAncestorFolder = item.type === 'folder' && _isAncestorOfGlob(itemPath, pathGlobPattern)

    if (!pathGlobPattern || (!_isMatch(itemPath, pathGlobPattern) && !isAncestorFolder)) {
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

const _isMatch = (itemPath: string, globPattern: string) =>
  picomatch.isMatch(itemPath, globPattern, {
    // allow dotfiles to match:
    dot: true,
    // escape brackets in the glob pattern so that only literal brackets are matched:
    literalBrackets: true,
  })

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

const _isAncestorOfGlob = (candidatePath: string, globPattern: string): boolean =>
  _isAncestorPath(candidatePath, _extractStaticPrefix(globPattern))

const _extractStaticPrefix = (globPattern: string): string => {
  const wildcardIndex = globPattern.search(/[*?{}]/)
  if (wildcardIndex === -1) {
    return globPattern
  }

  const prefix = globPattern.substring(0, wildcardIndex)
  const lastSlashIndex = prefix.lastIndexOf('/')

  return lastSlashIndex === -1 ? '' : prefix.substring(0, lastSlashIndex)
}

const _isAncestorPath = (ancestor: string, descendant: string): boolean => {
  if (ancestor === descendant) {
    return true
  }

  const ancestorParts = ancestor.split('/').filter((part) => part !== '')
  const descendantParts = descendant.split('/').filter((part) => part !== '')

  if (ancestorParts.length >= descendantParts.length) {
    return false
  }

  return ancestorParts.every((part, index) => part === descendantParts[index])
}
