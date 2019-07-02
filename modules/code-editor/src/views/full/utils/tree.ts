import { ITreeNode } from '@blueprintjs/core'
import find from 'lodash/find'

import { EditableFile } from '../../../backend/typings'

const FOLDER_ICON = 'folder-close'
const DOCUMENT_ICON = 'document'

const addNode = (tree: ITreeNode, folders: ITreeNode[], file, data: any) => {
  for (const folderDesc of folders) {
    let folder = find(tree.childNodes, folderDesc) as ITreeNode | undefined
    if (!folder) {
      folder = { ...folderDesc, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }

  tree.childNodes.push({ ...file, ...data })
}

export const splitPath = (location: string, expandedNodeIds: object) => {
  const paths = location.split('/')
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

export const buildTree = (files: EditableFile[], expandedNodeIds: object, filterFileName: string | undefined) => {
  const tree: ITreeNode = { id: 'root', label: '<root>', childNodes: [] }

  files.forEach(fileData => {
    const { folders, file } = splitPath(fileData.location, expandedNodeIds)
    if (!filterFileName || !filterFileName.length || file.label.includes(filterFileName)) {
      addNode(tree, folders, file, { nodeData: fileData })
    }
  })

  return tree.childNodes
}
