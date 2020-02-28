import { Classes, ContextMenu, ITreeNode, Tree } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useEffect, useReducer, useRef, useState } from 'react'

export const FOLDER_ICON = 'folder-close'
export const DOCUMENT_ICON = 'document'

export interface TreeViewProps<T> {
  /** List of elements to display in the tree view */
  elements?: T[]
  /** Name of the property to use on elements to get the full path. Defaults to "path" */
  pathProps?: string
  nodeRenderer: ElementRenderer<T>
  folderRenderer?: ElementRenderer<string>
  /** Called after the tree has been built. Can be used to reorder elements before display */
  postProcessing?: PostProcessing<T>
  /** You can also parse nodes manually and provide them to the view */
  nodes?: TreeNode<T>[]
  /** Filters the displayed nodes (expands all folders when filtering) */
  filter?: Filter
  /** The full paths of nodes which should be expanded */
  expandedPaths?: string[]
  /** Ensure that elements having "field" set to "value" are displayed (their parent will be expanded) */
  visibleElements?: { value: string; field: string }[]
  /** Whether or not to highlight the folder's name on click */
  highlightFolders?: boolean

  onDoubleClick?: (element: T | string, elementType: ElementType) => void
  onClick?: (element: T | string, elementType: ElementType) => void
  onContextMenu?: (element: T | string, elementType: ElementType) => JSX.Element | undefined
  onExpandToggle?: (node: TreeNode<T>, isExpanded: boolean) => void
}

type ElementType = 'document' | 'folder'

type TreeNode<T> = ITreeNode<T> & {
  id: string
  type: string
  parent?: TreeNode<T>
  fullPath: string
  childNodes?: TreeNode<T>[]
}

type ElementRenderer<T> = (element: T) => { label: JSX.Element | string; icon?: any }
type PostProcessing<T> = (nodes: TreeNode<T>[]) => TreeNode<T>[]

interface Filter {
  text: string
  /** The field to compare text on the provided element */
  field: string
}

interface BuildTreeParams<T> {
  elements: T[]
  filter?: Filter
  nodeRenderer: ElementRenderer<T>
  folderRenderer?: ElementRenderer<string>
  postProcessing?: PostProcessing<T>
  pathProps?: string
}

const usePrevious = value => {
  const ref = useRef()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

const TreeView = <T extends {}>(props: TreeViewProps<T>) => {
  const [nodes, setNodes] = useState<TreeNode<T>[]>([])
  const [expanded, setExpanded] = useState(props.expandedPaths || [])
  const prevElements = usePrevious(props.elements)
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  const { elements, filter, nodeRenderer, folderRenderer, postProcessing, pathProps } = props

  useEffect(() => {
    if (!elements || (!!elements?.length && _.isEqual(props.elements, prevElements))) {
      return
    }

    const nodes = buildTree({
      elements,
      filter,
      nodeRenderer,
      folderRenderer,
      postProcessing,
      pathProps
    })

    traverseTree(nodes, node => {
      if (props.visibleElements?.find(x => node.nodeData?.[x.field] === x.value)) {
        handleNodeExpansion(node.parent!, true)
        node.parent!.isExpanded = true
        node.isSelected = true
      }

      if (filter?.text || expanded.find(path => path === node.fullPath)) {
        node.isExpanded = true
      }
    })

    setNodes(nodes)
  }, [elements, filter])

  useEffect(() => {
    props.nodes && setNodes(props.nodes)
  }, [props.nodes])

  useEffect(() => {
    setExpanded(props.expandedPaths || [])
  }, [props.expandedPaths])

  const handleNodeExpansion = (node: TreeNode<T>, isExpanded: boolean) => {
    isExpanded ? setExpanded([...expanded, node.fullPath]) : setExpanded(expanded.filter(x => x !== node.fullPath))
    node.isExpanded = isExpanded

    props.onExpandToggle?.(node, isExpanded)
  }

  const handleNodeClick = (selectedNode: TreeNode<T>) => {
    if (selectedNode.nodeData) {
      props.onClick?.(selectedNode.nodeData, 'document')
    } else {
      props.onClick?.(selectedNode.fullPath, 'folder')
    }

    traverseTree(nodes, node => {
      if (node === selectedNode) {
        if (props.highlightFolders || (!props.highlightFolders && node.type !== 'folder')) {
          node.isSelected = true
        }

        if (!node.nodeData) {
          node.isExpanded ? handleNodeExpansion(node, false) : handleNodeExpansion(node, true)
        }
      } else {
        node.isSelected = false
      }
    })

    forceUpdate()
  }

  const handleNodeDoubleClick = (selectedNode: TreeNode<T>) => {
    if (selectedNode.nodeData) {
      props.onDoubleClick?.(selectedNode.nodeData, 'document')
    } else {
      props.onDoubleClick?.(selectedNode.fullPath, 'folder')
    }
  }

  const handleContextMenu = (node: TreeNode<T>, _path, e) => {
    const contextMenu = node.nodeData
      ? props.onContextMenu?.(node.nodeData, 'document')
      : props.onContextMenu?.(node.fullPath, 'folder')

    if (contextMenu) {
      e.preventDefault()
      ContextMenu.show(contextMenu, { left: e.clientX, top: e.clientY })
    }
  }

  if (!nodes) {
    return null
  }

  return (
    <Tree
      contents={nodes}
      onNodeClick={node => handleNodeClick(node as TreeNode<T>)}
      onNodeDoubleClick={node => handleNodeDoubleClick(node as TreeNode<T>)}
      onNodeCollapse={node => handleNodeExpansion(node as TreeNode<T>, false)}
      onNodeExpand={node => handleNodeExpansion(node as TreeNode<T>, true)}
      onNodeContextMenu={(node, _p, e) => handleContextMenu(node as TreeNode<T>, _p, e)}
      className={Classes.ELEVATION_0}
    />
  )
}

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
    const { label, icon } = folderRenderer(folder)

    folders.push({
      id: folder,
      label,
      icon: icon || FOLDER_ICON,
      fullPath: currentPath.join('/'),
      type: 'folder',
      childNodes: undefined
    })
  }

  currentPath.push(nodeLabel)

  const id = currentPath.join('/')
  const { label, icon } = nodeRenderer(nodeData)

  return {
    folders,
    leafNode: { id, label, icon: icon || DOCUMENT_ICON, fullPath: id, type: 'node' }
  }
}

function buildTree<T>({
  elements,
  nodeRenderer,
  filter,
  folderRenderer,
  postProcessing,
  pathProps
}: BuildTreeParams<T>): TreeNode<T>[] {
  if (!elements) {
    return []
  }

  if (!folderRenderer) {
    folderRenderer = label => ({ label })
  }

  const tree: TreeNode<T> = {
    id: 'root',
    label: '<root>',
    type: 'root',
    fullPath: '',
    childNodes: []
  }

  const lowerCaseFilter = filter?.text?.toLowerCase()

  for (const nodeData of elements) {
    const nodePath = nodeData[pathProps || 'path']
    if (!nodePath) {
      console.error(`Invalid path`)
      return []
    }

    const { folders, leafNode } = splitPath(nodePath, nodeData, nodeRenderer, folderRenderer!)
    if (!filter?.text || nodeData[filter.field || 'id']?.toLowerCase().includes(lowerCaseFilter)) {
      addNode(tree, folders, leafNode, { nodeData })
    }
  }

  sortChildren(tree)

  return postProcessing ? postProcessing(tree.childNodes!) : tree.childNodes!
}

function traverseTree<T>(nodes: TreeNode<T>[], callback: (node: TreeNode<T>) => void) {
  if (nodes == null) {
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
      return a.name < b.name ? -1 : 1
    }
    if (a.type === 'folder') {
      return -1
    } else {
      return 1
    }
  })

  tree.childNodes.forEach(sortChildren)
}

export default TreeView
