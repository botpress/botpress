import { ITreeNode, Tree } from '@blueprintjs/core'
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

export const buildTree = (files: EditableFile[], expandedNodeIds: object) => {
  const tree: ITreeNode = { id: 'root', label: '<root>', childNodes: [] }

  files.forEach(fileData => {
    const { folders, file } = splitPath(fileData.location, expandedNodeIds)
    addNode(tree, folders, file, { nodeData: fileData })
  })

  return tree.childNodes
}

export const renameTreeNode = async (
  node: ITreeNode<any>,
  treeRef: React.RefObject<Tree<any>>,
  callback: (newName: string) => Promise<void>
) => {
  const nodeDomElement = treeRef.current.getNodeContentElement(node.id)

  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'bp3-input bp3-small'
  input.value = node.label as string

  const div = document.createElement('div')
  div.className = nodeDomElement.className

  div.appendChild(input)

  nodeDomElement.replaceWith(div)

  input.focus()
  input.select()

  const closeRename = async e => {
    e.preventDefault()
    div.replaceWith(nodeDomElement)
    window.removeEventListener('keydown', keyboardListener)
    window.removeEventListener('mousedown', mouseListener)
    const file = node.nodeData as EditableFile
    let newName = input.value as string
    newName = newName.endsWith('.js') ? newName : newName + '.js'
    if (newName === node.label) {
      return
    }
    try {
      await callback(newName)
    } catch (e) {
      return
    }
    node.label = newName
  }
  const keyboardListener = async e => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      await closeRename(e)
    }
  }
  const mouseListener = async e => {
    if (!div.contains(e.target)) {
      await closeRename(e)
    }
  }
  window.addEventListener('keydown', keyboardListener)
  window.addEventListener('mousedown', mouseListener)
}
