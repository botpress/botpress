import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import React from 'react'

import { EditableFile } from '../../backend/typings'

import { buildTree, renameTreeNode } from './utils/tree'

export default class FileNavigator extends React.Component<Props, State> {
  state = {
    files: undefined,
    nodes: []
  }

  treeRef: React.RefObject<Tree<NodeData>>
  constructor(props) {
    super(props)
    this.treeRef = React.createRef()
  }

  async componentDidMount() {
    await this.refreshNodes()
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files && this.props.files) {
      await this.refreshNodes()
    }
  }

  async refreshNodes() {
    if (!this.props.files) {
      return
    }

    const nodes: ITreeNode[] = this.props.files.map(dir => ({
      id: dir.label,
      label: dir.label,
      icon: 'folder-close',
      hasCaret: true,
      isExpanded: true,
      childNodes: buildTree(dir.files, this.props.expandedNodes)
    }))

    this.setState({ nodes })
  }

  private handleNodeClick = (node: ITreeNode) => {
    const originallySelected = node.isSelected
    this.traverseTree(this.state.nodes, n => (n.isSelected = false))
    node.isSelected = originallySelected !== null

    // If nodeData is set, it's a file, otherwise a folder
    if (node.nodeData) {
      this.props.onFileSelected && this.props.onFileSelected(node.nodeData as EditableFile)
      this.forceUpdate()
    } else {
      node.isExpanded ? this.handleNodeCollapse(node) : this.handleNodeExpand(node)
    }
  }

  private handleNodeCollapse = (node: ITreeNode) => {
    this.props.onNodeStateChanged(node.id as string, false)
    node.isExpanded = false

    this.forceUpdate()
  }

  private handleNodeExpand = (node: ITreeNode) => {
    this.props.onNodeStateChanged(node.id as string, true)
    node.isExpanded = true

    this.forceUpdate()
  }

  private traverseTree(nodes: ITreeNode[], callback: (node: ITreeNode) => void) {
    if (nodes == null) {
      return
    }

    for (const node of nodes) {
      callback(node)
      this.traverseTree(node.childNodes, callback)
    }
  }

  handleContextMenu = (node: ITreeNode<NodeData>, path, e) => {
    if (!node.nodeData) {
      return null
    }

    e.preventDefault()
    ContextMenu.show(
      <Menu>
        <MenuItem
          icon="edit"
          text="Rename"
          onClick={async () =>
            await renameTreeNode(node, this.treeRef, async newName => this.renameThreeNode(node, newName))
          }
        />
        <MenuItem icon="delete" text="Delete" onClick={() => this.props.onNodeDelete(node.nodeData as EditableFile)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  renameThreeNode = async (node: ITreeNode<NodeData>, newName: string) => {
    await this.props.onNodeRename(node.nodeData as EditableFile, newName)
  }

  render() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <Tree
        ref={this.treeRef}
        contents={this.state.nodes}
        onNodeContextMenu={this.handleContextMenu}
        onNodeClick={this.handleNodeClick}
        onNodeCollapse={this.handleNodeCollapse}
        onNodeExpand={this.handleNodeExpand}
        className={Classes.ELEVATION_0}
      />
    )
  }
}

interface Props {
  files: any
  onFileSelected: (file: EditableFile) => void
  onNodeStateChanged: (id: string, isExpanded: boolean) => void
  expandedNodes: object
  onNodeDelete: (file: EditableFile) => Promise<void>
  onNodeRename: (file: EditableFile, newName: string) => Promise<void>
}

interface State {
  nodes: ITreeNode[]
}

interface NodeData {
  name: string
}
