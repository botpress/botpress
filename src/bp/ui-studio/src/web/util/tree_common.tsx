import { ITreeNode } from '@blueprintjs/core'
import _ from 'lodash'

export const FOLDER_ICON = 'folder-close'
export const DIRTY_ICON = 'clean'
export const FLOW_ICON = 'document'
export const MAIN_FLOW_ICON = 'flow-end'
export const ERROR_FLOW_ICON = 'pivot'
export const TIMEOUT_ICON = 'time'

export function traverseTree<T>(nodes: ITreeNode<T>[], callback: (node: ITreeNode<T>) => void) {
  if (nodes == null) {
    return
  }

  for (const node of nodes) {
    callback(node)
    traverseTree(node.childNodes, callback)
  }
}

export const getUniqueId = node => `${node.type}:${node.fullPath}`

export const addNode = (tree, folders, flowDesc, data) => {
  for (const folderDesc of folders) {
    let folder = _.find(tree.childNodes, x => x.id === folderDesc.id)
    if (!folder) {
      folder = { ...folderDesc, parent: tree, childNodes: [] }
      tree.childNodes.push(folder)
    }
    tree = folder
  }
  tree.childNodes.push({ ...flowDesc, parent: tree, ...data })
}

const compareNodes = (a, b) => {
  if (a.type === b.type) {
    return a.name < b.name ? -1 : 1
  }
  if (a.type === 'folder') {
    return -1
  } else {
    return 1
  }
}

export const sortChildren = tree => {
  if (!tree.childNodes) {
    return
  }
  tree.childNodes.sort(compareNodes)
  tree.childNodes.forEach(sortChildren)
}
