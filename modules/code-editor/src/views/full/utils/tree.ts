import { ITreeNode } from '@blueprintjs/core'
import find from 'lodash/find'

import { EditableFile } from '../../../backend/typings'

const FOLDER_ICON = 'folder-close'
const DOCUMENT_ICON = 'document'
const EXAMPLE_ICON = 'lightbulb'

const addNode = (tree: ITreeNode, folders: ITreeNode[], file, data: any, secondaryLabel?: any) => {
  for (const folderDesc of folders) {
    let folder = find(tree.childNodes, folderDesc) as ITreeNode | undefined
    if (!folder) {
      folder = { ...folderDesc, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }

  tree.childNodes.push({ ...file, ...data, secondaryLabel })
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
      icon: fileData.isExample ? EXAMPLE_ICON : DOCUMENT_ICON,
      label: filename
    }
  }
}

export const buildTree = (
  files: EditableFile[],
  expandedNodeIds: object,
  filterFileName: string | undefined,
  readonlyIcon: any
) => {
  const tree: ITreeNode = { id: 'root', label: '<root>', childNodes: [] }

  files.forEach(fileData => {
    const { folders, file } = splitPath(fileData, expandedNodeIds)
    if (!filterFileName || !filterFileName.length || file.label.includes(filterFileName)) {
      addNode(tree, folders, file, { nodeData: fileData }, fileData.readOnly ? readonlyIcon : undefined)
    }
  })

  return tree.childNodes
}
