import { ITreeNode } from '@blueprintjs/core'
import { FileWithMetadata } from 'full/Editor'
import find from 'lodash/find'

import { EditableFile } from '../../../backend/typings'

export const EXAMPLE_FOLDER_LABEL = 'Examples'
export const FOLDER_ICON = 'folder-close'
export const DOCUMENT_ICON = 'document'
export const FOLDER_EXAMPLE = 'lightbulb'

const addNode = (tree: ITreeNode, folders: ITreeNode[], file, data: any, secondaryLabel?: any, isOpen?) => {
  for (const folderDesc of folders) {
    let folder = find(tree.childNodes, folderDesc) as ITreeNode | undefined
    if (!folder) {
      folder = { ...folderDesc, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }

  tree.childNodes.push({ ...file, ...data, secondaryLabel, isOpen })
}

export const splitPath = (fileData: EditableFile, expandedNodeIds: object) => {
  const paths = fileData.location.split('/')
  const filename = paths[paths.length - 1]
  const fileFolders = paths.slice(0, paths.length - 1)
  const folders: ITreeNode[] = []
  const currentPath = []

  for (const folder of fileFolders) {
    currentPath.push(folder)

    const id = currentPath.join('/')
    folders.push({ id, icon: FOLDER_ICON, label: folder, isExpanded: expandedNodeIds[id] })
  }

  currentPath.push(filename)
  return {
    folders,
    file: {
      id: currentPath.join('/'),
      icon: DOCUMENT_ICON,
      label: filename
    }
  }
}

export const buildTree = (
  files: EditableFile[],
  expandedNodeIds: object,
  openedFiles: FileWithMetadata[],
  filterFileName: string | undefined,
  icons: any
) => {
  const tree: ITreeNode = { id: 'root', label: '<root>', childNodes: [] }

  files.forEach(fileData => {
    const { folders, file } = splitPath(fileData, expandedNodeIds)
    if (!filterFileName || !filterFileName.length || file.label.includes(filterFileName)) {
      const openedFile = openedFiles.find(x => x.location === fileData.location)

      let icon = fileData.readOnly ? icons.readOnly : undefined
      if (openedFile?.hasChanges) {
        icon = icons.hasChanges
      }

      addNode(tree, folders, file, { nodeData: fileData }, icon, !!openedFile)
    }
  })

  return tree.childNodes
}
