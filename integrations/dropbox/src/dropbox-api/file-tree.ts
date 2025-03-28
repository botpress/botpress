import * as sdk from '@botpress/sdk'
import { File as FileEntity, Folder as FolderEntity, Deleted as DeletedEntity } from '../../definitions'

/*
  From the Dropbox API documentation:

  Iterate through each entry in order and process them as follows to keep your
  local state in sync:

  - For each FileMetadata, store the new entry at the given path in your local
    state. If the required parent folders don't exist yet, create them. If
    there's already something else at the given path, replace it and remove all
    its children.

  - For each FolderMetadata, store the new entry at the given path in your local
    state. If the required parent folders don't exist yet, create them. If
    there's already something else at the given path, replace it but leave the
    children as they are.

  - For each DeletedMetadata, if your local state has something at the given
    path, remove it and all its children. If there's nothing at the given path,
    ignore this entry.

  In this implementation, we do most of this, but we do not create the parents
  because we don't need them.
*/

type FileOrFolder = FileEntity.InferredType | FolderEntity.InferredType
type Item = FileOrFolder | DeletedEntity.InferredType

export type FileTreeDiff = { added: FileOrFolder[]; deleted: FileOrFolder[]; updated: FileOrFolder[] }

export class FileTree {
  private readonly _tree = new Map<string, FileOrFolder>() // path -> item

  public static fromJSON(json: string): FileTree {
    const fileTree = new FileTree()
    const items = JSON.parse(json) as Item[]

    for (const item of items) {
      fileTree.pushItem(item)
    }

    return fileTree
  }

  public getItems() {
    return Array.from(this._tree.values())
  }

  public toJSON() {
    return JSON.stringify(this.getItems())
  }

  public pushItem(item: Item): FileTreeDiff {
    const normalizedItem = this._normalizePath(item)

    switch (normalizedItem.itemType) {
      case 'file':
        return this._pushFile(normalizedItem)
      case 'folder':
        return this._pushFolder(normalizedItem)
      case 'deleted':
        return this._handleDeletion(normalizedItem)
      default:
        normalizedItem satisfies never
    }

    throw new sdk.RuntimeError(`Unknown item type: ${item.itemType}`)
  }

  public pushItems(items: Item[]): FileTreeDiff {
    return items.reduce<FileTreeDiff>(
      (acc, item) => {
        const itemDiff = this.pushItem(item)
        acc.added.push(...itemDiff.added)
        acc.deleted.push(...itemDiff.deleted)
        acc.updated.push(...itemDiff.updated)
        return acc
      },
      { added: [], deleted: [], updated: [] }
    )
  }

  private _normalizePath(item: Item): Item {
    let normalizedPath = item.path.trim().normalize()
    normalizedPath = item.path.startsWith('/') ? normalizedPath : `/${normalizedPath}`

    return { ...item, path: normalizedPath }
  }

  private _pushFile(fileItem: FileEntity.InferredType): FileTreeDiff {
    const deletedChildren: FileOrFolder[] = []
    const previousVersion = this._tree.get(fileItem.path)

    // From the Dropbox API documentation:
    // If there's already something else at the given path, replace it and
    // remove all its children:
    for (const childPath of this._tree.keys()) {
      if (childPath.startsWith(fileItem.path) && childPath !== fileItem.path) {
        deletedChildren.push(this._tree.get(childPath)!)
        this._tree.delete(childPath)
      }
    }

    this._tree.set(fileItem.path, fileItem)

    return {
      added: previousVersion && previousVersion.itemType === 'file' ? [] : [fileItem],
      updated: previousVersion && previousVersion.itemType === 'file' ? [previousVersion] : [],
      deleted: [
        ...deletedChildren,
        ...(previousVersion && previousVersion.itemType !== 'file' ? [previousVersion] : []),
      ],
    }
  }

  private _pushFolder(folderItem: FolderEntity.InferredType): FileTreeDiff {
    const previousVersion = this._tree.get(folderItem.path)
    this._tree.set(folderItem.path, folderItem)

    return {
      added: previousVersion && previousVersion.itemType === 'folder' ? [] : [folderItem],
      updated: previousVersion && previousVersion.itemType === 'folder' ? [previousVersion] : [],
      deleted: previousVersion && previousVersion.itemType !== 'folder' ? [previousVersion] : [],
    }
  }

  private _handleDeletion(deletedItem: DeletedEntity.InferredType): FileTreeDiff {
    const deletedChildren: FileOrFolder[] = []

    // Remove the deleted item and all its children
    for (const [path, child] of this._tree.entries()) {
      if (path.startsWith(deletedItem.path)) {
        deletedChildren.push(child)
        this._tree.delete(path)
      }
    }

    return {
      added: [],
      updated: [],
      deleted: deletedChildren,
    }
  }
}
