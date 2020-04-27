import { Classes, ContextMenu, Tree } from '@blueprintjs/core'
import { node } from 'prop-types'
import React, { useEffect, useReducer, useState } from 'react'

import { TreeNode, TreeViewProps } from './typings'
import { buildTree, traverseTree } from './utils'

export const FOLDER_ICON = 'folder-close'
export const DOCUMENT_ICON = 'document'

const TreeView = <T extends {}>(props: TreeViewProps<T>) => {
  const [nodes, setNodes] = useState<TreeNode<T>[]>([])
  const [expanded, setExpanded] = useState(props.expandedPaths || [])
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  const { elements, filterText, filterProps, nodeRenderer, folderRenderer, postProcessing, pathProps } = props

  useEffect(() => {
    if (!elements) {
      return
    }

    const nodes = buildTree({
      elements,
      filterText,
      filterProps,
      nodeRenderer,
      folderRenderer,
      postProcessing,
      pathProps
    })

    traverseTree(nodes, node => {
      if (props.visibleElements?.find(x => node.nodeData?.[x.field] === x.value)) {
        handleInitialNodeExpansion(node.parent!, true)
        node.parent!.isExpanded = true
        node.isSelected = true
      }

      if (filterText || expanded.find(path => path === node.fullPath)) {
        node.isExpanded = true
      }
    })

    setNodes(nodes)
  }, [elements, filterText])

  useEffect(() => {
    props.nodes && setNodes(props.nodes)
  }, [props.nodes])

  useEffect(() => {
    setExpanded(props.expandedPaths || [])
  }, [props.expandedPaths])

  const handleInitialNodeExpansion = (node: TreeNode<T>, isExpanded: boolean) => {
    changeNodeExpansion(node, isExpanded)

    if (node.parent) {
      handleInitialNodeExpansion(node.parent!, isExpanded)
    }
  }

  const changeNodeExpansion = (node: TreeNode<T>, isExpanded: boolean) => {
    isExpanded ? setExpanded([...expanded, node.fullPath]) : setExpanded(expanded.filter(x => x !== node.fullPath))
    node.isExpanded = isExpanded

    props.onExpandToggle?.(node, isExpanded)
  }

  const handleNodeClick = (selectedNode: TreeNode<T>) => {
    const preventClick = selectedNode.nodeData
      ? props.onClick?.(selectedNode.nodeData, 'document')
      : props.onClick?.(selectedNode.fullPath, 'folder')

    if (preventClick) {
      return
    }

    traverseTree(nodes, node => {
      if (node === selectedNode) {
        if (props.highlightFolders || (!props.highlightFolders && node.type !== 'folder')) {
          node.isSelected = true
        }

        if (!node.nodeData) {
          changeNodeExpansion(node, !node.isExpanded)
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
      onNodeClick={handleNodeClick}
      onNodeContextMenu={handleContextMenu}
      onNodeDoubleClick={handleNodeDoubleClick}
      onNodeCollapse={node => changeNodeExpansion(node as TreeNode<T>, false)}
      onNodeExpand={node => changeNodeExpansion(node as TreeNode<T>, true)}
      className={Classes.ELEVATION_0}
    />
  )
}

export default React.memo(TreeView)
