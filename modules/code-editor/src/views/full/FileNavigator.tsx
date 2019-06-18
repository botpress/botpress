import { Classes, ITreeNode, Tree } from '@blueprintjs/core'
import React from 'react'

import { EditableFile } from '../../backend/typings'

import { buildTree } from './utils/tree'

export default class FileNavigator extends React.Component<Props, State> {
  state = {
    files: undefined,
    nodes: []
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

  render() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <Tree
        contents={this.state.nodes}
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
}

interface State {
  nodes: ITreeNode[]
}
