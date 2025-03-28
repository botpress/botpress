import * as picomatch from 'picomatch'
import type * as models from '../../definitions/models'
import { MAX_FILE_SIZE_BYTES } from '../consts'
import * as bp from '.botpress'

type GlobMatcherProps = {
  configuration: Pick<bp.configuration.Configuration, 'includeFiles' | 'excludeFiles'>
  item: models.FolderItem
  itemPath: string
}

const SHOULD_EXCLUDE_FILE = true
const SHOULD_INCLUDE_FILE = false

export const shouldItemBeIgnored = ({ configuration, item, itemPath }: GlobMatcherProps) => {
  for (const { pathGlobPattern } of configuration.excludeFiles) {
    if (picomatch.isMatch(itemPath, pathGlobPattern)) {
      return SHOULD_EXCLUDE_FILE
    }
  }

  for (const { pathGlobPattern, maxSizeInBytes, modifiedAfter } of configuration.includeFiles) {
    if (!picomatch.isMatch(itemPath, pathGlobPattern)) {
      continue
    }

    const isFileWithUnmetRequirements =
      item.type === 'file' &&
      ((maxSizeInBytes !== undefined && item.sizeInBytes !== undefined && item.sizeInBytes > maxSizeInBytes) ||
        (item.sizeInBytes !== undefined && item.sizeInBytes > MAX_FILE_SIZE_BYTES) ||
        (modifiedAfter !== undefined &&
          item.lastModifiedDate !== undefined &&
          new Date(item.lastModifiedDate) < new Date(modifiedAfter)))

    if (!isFileWithUnmetRequirements) {
      return SHOULD_INCLUDE_FILE
    }
  }

  return SHOULD_EXCLUDE_FILE
}
