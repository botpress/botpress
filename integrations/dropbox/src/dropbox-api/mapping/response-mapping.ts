import * as dropbox from 'dropbox'
import { File as FileEntity, Folder as FolderEntity, Deleted as DeletedEntity } from '../../../definitions'

export type File = FileEntity.InferredType
export type Folder = FolderEntity.InferredType
export type Deleted = DeletedEntity.InferredType

export type DropboxFileReference = dropbox.files.FileMetadata
export type DropboxFolderReference = dropbox.files.FolderMetadata
export type DropboxDeletedMetadata = dropbox.files.DeletedMetadata
export type DropboxReference = DropboxFileReference | DropboxFolderReference | DropboxDeletedMetadata

export namespace ResponseMapping {
  export const mapFile = (dropboxFile: DropboxFileReference): File => ({
    id: dropboxFile.id,
    itemType: 'file',
    name: dropboxFile.name,
    fileHash: dropboxFile.content_hash ?? '',
    isDeleted: false,
    isDownloadable: dropboxFile.is_downloadable ?? true,
    isShared: dropboxFile.sharing_info !== undefined,
    modifiedAt: dropboxFile.server_modified,
    path: dropboxFile.path_display ?? dropboxFile.path_lower ?? '',
    revision: dropboxFile.rev,
    size: dropboxFile.size,
    webUrl: dropboxFile.preview_url,
    symlinkTarget: dropboxFile.symlink_info?.target,
  })

  export const mapFolder = (dropboxFolder: DropboxFolderReference): Folder => ({
    id: dropboxFolder.id,
    itemType: 'folder',
    name: dropboxFolder.name,
    isDeleted: false,
    isShared: dropboxFolder.sharing_info !== undefined,
    path: dropboxFolder.path_display ?? dropboxFolder.path_lower ?? '',
    webUrl: dropboxFolder.preview_url,
  })

  export const mapDeleted = (dropboxDeleted: DropboxDeletedMetadata): Deleted => ({
    itemType: 'deleted',
    name: dropboxDeleted.name,
    path: dropboxDeleted.path_display ?? dropboxDeleted.path_lower ?? '',
    isDeleted: true,
  })

  export const mapItem = (dropboxItem: DropboxReference): File | Folder | Deleted =>
    _isDropboxFileReference(dropboxItem)
      ? mapFile(dropboxItem)
      : _isDropboxFolderReference(dropboxItem)
        ? mapFolder(dropboxItem)
        : mapDeleted(dropboxItem)

  export const mapSearchMatch = (searchMatch: dropbox.files.SearchMatchV2) => ({
    item: mapItem((searchMatch.metadata as dropbox.files.MetadataV2Metadata).metadata),
    matchType: searchMatch.match_type?.['.tag'],
  })

  const _isDropboxFileReference = (item: DropboxReference): item is DropboxFileReference =>
    '.tag' in item && item['.tag'] === 'file'
  const _isDropboxFolderReference = (item: DropboxReference): item is DropboxFolderReference =>
    '.tag' in item && item['.tag'] === 'folder'
}
