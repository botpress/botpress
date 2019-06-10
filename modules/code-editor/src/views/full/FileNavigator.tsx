import React from 'react'

// @ts-ignore
import { Classes, ITreeNode, Tree } from '@blueprintjs/core'

import { buildTree } from './utils/tree'

export default class FileNavigator extends React.Component<any, any> {
  state = {
    files: undefined,
    nodes: []
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.refreshNodes()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.files !== this.props.files && this.props.files) {
      // tslint:disable-next-line: no-floating-promises
      this.refreshNodes()
    }
  }

  async refreshNodes() {
    if (!this.props.files) {
      return
    }

    const { actionsGlobal, actionsBot } = this.props.files

    const nodes = []

    if (actionsBot) {
      nodes.push({
        label: `${window['BOT_NAME']} (bot)`,
        icon: 'folder-close',
        hasCaret: true,
        isExpanded: true,
        childNodes: buildTree(this.props.files.actionsBot)
      })
    }

    if (actionsGlobal) {
      nodes.push({
        label: 'Global',
        icon: 'folder-close',
        isExpanded: true,
        childNodes: buildTree(this.props.files.actionsGlobal)
      })
    }

    this.setState({ nodes })
  }

  private handleNodeClick = (nodeData: ITreeNode) => {
    const originallySelected = nodeData.isSelected

    this.traverseTree(this.state.nodes, n => (n.isSelected = false))

    nodeData.isSelected = originallySelected !== null

    this.props.onFileSelected && this.props.onFileSelected(nodeData.data)
    this.setState(this.state)
  }

  private handleNodeCollapse = (nodeData: ITreeNode) => {
    nodeData.isExpanded = false
    this.setState(this.state)
  }

  private handleNodeExpand = (nodeData: ITreeNode) => {
    nodeData.isExpanded = true
    this.setState(this.state)
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
