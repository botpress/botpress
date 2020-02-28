import { Classes, ContextMenu, Tree } from '@blueprintjs/core'
import _ from 'lodash'
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
        handleNodeExpansion(node.parent!, true)
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
      onNodeClick={handleNodeClick}
      onNodeContextMenu={handleContextMenu}
      onNodeDoubleClick={handleNodeDoubleClick}
      onNodeCollapse={node => handleNodeExpansion(node as TreeNode<T>, false)}
      onNodeExpand={node => handleNodeExpansion(node as TreeNode<T>, true)}
      className={Classes.ELEVATION_0}
    />
  )
}

export default React.memo(TreeView)
