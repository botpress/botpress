import _ from 'lodash'
import { useEffect, useRef } from 'react'

import { DOCUMENT_ICON, FOLDER_ICON } from '.'
import { BuildTreeParams, ElementRenderer, TreeNode } from './typings'

function splitPath<T>(
  fullPath: string,
  nodeData: T,
  nodeRenderer: ElementRenderer<T>,
  folderRenderer: ElementRenderer<string>
) {
  const splitPath = fullPath.split('/')
  const nodeLabel = splitPath[splitPath.length - 1]
  const parentFolders = splitPath.slice(0, splitPath.length - 1)

  const folders: TreeNode<T>[] = []
  const currentPath: string[] = []

  for (const folder of parentFolders) {
    currentPath.push(folder)
    const { label, icon, name } = folderRenderer(folder)

    folders.push({
      id: folder,
      label,
      name,
      icon: icon || FOLDER_ICON,
      fullPath: currentPath.join('/'),
      type: 'folder',
      childNodes: undefined
    })
  }

  currentPath.push(nodeLabel)

  const id = currentPath.join('/')
  const { label, icon, name } = nodeRenderer(nodeData)

  return {
    folders,
    leafNode: { id, label, icon: icon || DOCUMENT_ICON, name, fullPath: id, type: 'node' }
  }
}

export function buildTree<T>({
  elements,
  filterText,
  nodeRenderer = (element: T) => ({ label: element['label'], icon: element['icon'] }),
  folderRenderer = (label: string) => ({ label }),
  postProcessing,
  filterProps = 'path',
  pathProps = 'path'
}: BuildTreeParams<T>): TreeNode<T>[] {
  if (!elements) {
    return []
  }

  const tree: TreeNode<T> = {
    id: 'root',
    label: '<root>',
    type: 'root',
    fullPath: '',
    childNodes: []
  }

  const lowerCaseFilter = filterText?.toLowerCase()

  for (const nodeData of elements) {
    const nodePath = nodeData[pathProps]
    if (!nodePath) {
      console.error('Invalid path')
      return []
    }

    const { folders, leafNode } = splitPath(nodePath, nodeData, nodeRenderer, folderRenderer!)
    if (!filterText || nodeData[filterProps]?.toLowerCase().includes(lowerCaseFilter)) {
      addNode(tree, folders, leafNode, { nodeData })
    }
  }

  sortChildren(tree)

  return postProcessing ? postProcessing(tree.childNodes!) : tree.childNodes!
}

export function traverseTree<T>(nodes: TreeNode<T>[], callback: (node: TreeNode<T>) => void) {
  if (!nodes) {
    return
  }

  for (const node of nodes) {
    callback(node)
    traverseTree(node.childNodes!, callback)
  }
}

function addNode<T>(tree: TreeNode<T>, folders: TreeNode<T>[], leafNode: TreeNode<T>, data) {
  for (const folderDesc of folders) {
    let folder = _.find(tree.childNodes, x => x.id === folderDesc.id)
    if (!folder) {
      folder = { ...folderDesc, parent: tree, childNodes: [] }
      tree.childNodes?.push(folder)
    }
    tree = folder
  }

  tree.childNodes?.push({ ...leafNode, parent: tree, ...data })
}

const sortChildren = tree => {
  if (!tree.childNodes) {
    return
  }

  tree.childNodes.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name, undefined, { numeric: true })
    }
    if (a.type === 'folder') {
      return -1
    } else {
      return 1
    }
  })

  tree.childNodes.forEach(sortChildren)
}

export const usePrevious = value => {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
