import * as bp from '.botpress'

type FilesReadonlyFile = bp.events.Events['fileCreated']['file']
type FilesReadonlyFolder = bp.events.Events['folderDeletedRecursive']['folder']

export const mapFile = (
  file: { name: string; serverRelativeUrl: string; length: number; timeLastModified: string; eTag: string },
  parentPath: string
): FilesReadonlyFile => ({
  type: 'file',
  id: file.serverRelativeUrl,
  name: file.name,
  parentId: parentPath,
  absolutePath: file.serverRelativeUrl,
  sizeInBytes: file.length,
  lastModifiedDate: new Date(file.timeLastModified).toISOString(),
  contentHash: file.eTag,
})

export const mapFolder = (
  folder: { name: string; serverRelativeUrl: string },
  parentPath: string
): FilesReadonlyFolder => ({
  type: 'folder',
  id: folder.serverRelativeUrl,
  name: folder.name,
  parentId: parentPath,
  absolutePath: folder.serverRelativeUrl,
})

export const mapLibrary = (lib: { name: string; serverRelativeUrl: string }): FilesReadonlyFolder => ({
  type: 'folder',
  id: lib.serverRelativeUrl,
  name: lib.name,
  absolutePath: lib.serverRelativeUrl,
})
