import * as sdk from 'botpress/sdk'

import 'jest'
import minimatch from 'minimatch'

// fileData should be of the form:
// {
//   rootFolderName1: {
//     fileName1: data,
//     fileName2: data,
//     ...
//   },
//   ...
// }
export const makeMockGhost = (fileData: { [key: string]: { [key: string]: any } } = {}): sdk.ScopedGhostService => {
  return {
    upsertFile: jest.fn(
      (rootFolder: string, file: string, content: string | Buffer, options?: sdk.UpsertOptions): Promise<void> => {
        if (fileData[rootFolder] === undefined) {
          fileData[rootFolder] = {}
        }
        if (typeof content === 'string') {
          fileData[rootFolder][file] = JSON.parse(content)
        } else {
          fileData[rootFolder][file] = JSON.parse(content.toString())
        }
        return
      }
    ),
    readFileAsObject: jest.fn(
      async <T>(rootFolder: string, file: string): Promise<T> => {
        // Do a deep copy
        return JSON.parse(JSON.stringify(fileData[rootFolder][file])) as T
      }
    ),
    directoryListing: jest.fn(
      async (
        rootFolder: string,
        fileEndingPattern: string,
        exclude?: string | string[],
        includeDotFiles?: boolean,
        options?: sdk.DirectoryListingOptions
      ): Promise<string[]> => {
        if (!fileData[rootFolder]) {
          return []
        }
        let files: string[] = Object.keys(fileData[rootFolder])
        files = files.filter(f => minimatch(f, fileEndingPattern, { matchBase: true }))
        const toExclude = exclude || options?.excludes
        if (typeof toExclude === 'string') {
          files = files.filter(f => !minimatch(f, toExclude, { matchBase: true }))
        } else if (Array.isArray(toExclude)) {
          for (const ex of toExclude) {
            files = files.filter(f => !minimatch(f, ex, { matchBase: true }))
          }
        }
        if (!(includeDotFiles || options?.includeDotFiles)) {
          files = files.filter(f => !f.startsWith('.'))
        }
        return files
      }
    )
  }
}
