import * as dropbox from 'dropbox'
import { File as FileEntity, Folder as FolderEntity } from '../../../definitions'

type File = FileEntity.InferredType
type Folder = FolderEntity.InferredType

type DropboxFile = dropbox.files.FileMetadata
type DropboxFolder = dropbox.files.FolderMetadata
type DropboxItem =
  | dropbox.files.FileMetadataReference
  | dropbox.files.FolderMetadataReference
  | dropbox.files.DeletedMetadataReference

export namespace ResponseMapping {
  export const mapFile = (dropboxFile: DropboxFile): File => ({
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

  export const mapFolder = (dropboxFolder: DropboxFolder): Folder => ({
    id: dropboxFolder.id,
    itemType: 'folder',
    name: dropboxFolder.name,
    isDeleted: false,
    isShared: dropboxFolder.sharing_info !== undefined,
    path: dropboxFolder.path_display ?? dropboxFolder.path_lower ?? '',
    webUrl: dropboxFolder.preview_url,
  })

  export const mapItem = (dropboxItem: DropboxItem): File | Folder =>
    dropboxItem['.tag'] === 'file' ? mapFile(dropboxItem) : mapFolder(dropboxItem as DropboxFolder)

  export const mapSearchMatch = (searchMatch: dropbox.files.SearchMatchV2) => ({
    item: mapItem((searchMatch.metadata as dropbox.files.MetadataV2Metadata).metadata),
    matchType: searchMatch.match_type?.['.tag'],
  })
}
