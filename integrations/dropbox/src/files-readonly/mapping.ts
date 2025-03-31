import { File as FileEntity, Folder as FolderEntity } from '../../definitions'
import * as bp from '.botpress'

type FilesReadonlyFile = bp.events.Events['fileCreated']['file']
type FilesReadonlyFolder = bp.events.Events['folderDeletedRecursive']['folder']

export const mapFile = (file: FileEntity.InferredType): FilesReadonlyFile => ({
  id: file.id,
  absolutePath: file.path,
  name: file.name,
  type: 'file',
  contentHash: file.fileHash,
  lastModifiedDate: file.modifiedAt,
  sizeInBytes: file.size,
})

export const mapFolder = (folder: FolderEntity.InferredType): FilesReadonlyFolder => ({
  id: folder.id,
  absolutePath: folder.path,
  name: folder.name,
  type: 'folder',
})
