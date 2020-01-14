import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import axios from 'axios'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { traverseTree } from '~/util/tree_common'

import { buildFlowsTree } from './tree_util'

interface State {
  nodes: ITreeNode<NodeData>[]
}

interface NodeData {
  name: string
}

class LibraryList extends Component<any> {
  state: State = {
    nodes: []
  }

  componentDidMount() {
    this.updateFlows()
  }

  componentDidUpdate(prevProps) {
    if (this.props.filter !== prevProps.filter) {
      this.updateFlows()
    }
  }

  async updateFlows() {
    const { data } = await axios.get(`${window.BOT_API_PATH}/mod/ndu/library`)
    const entries = data.map(x => ({ ...x, name: x.elementPath }))
    const nodes = buildFlowsTree(entries, this.props.filter, {})

    if (this.props.filter) {
      traverseTree(nodes, n => (n.isExpanded = true))
    }

    this.setState({ nodes })
  }

  handleDelete = itemId => {
    if (
      confirm(
        `Are you sure you want to remove this element from your library? The element will still be available elsewhere`
      )
    ) {
      this.props.removeFromLibrary(itemId)
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
          id="btn-remove"
          icon="remove"
          text="Remove from library"
          onClick={() => this.handleDelete(node.nodeData)}
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  private handleNodeClick = (node: ITreeNode<NodeData>) => {
    const originallySelected = node.isSelected

    traverseTree(this.state.nodes, n => (n.isSelected = false))

    if (node['type'] !== 'folder') {
      node.isSelected = originallySelected !== null
    }

    if (!node.nodeData) {
      node.isExpanded ? this.handleNodeCollapse(node) : this.handleNodeExpand(node)
    }

    this.forceUpdate()
  }

  private handleNodeCollapse = (node: ITreeNode) => {
    node.isExpanded = false
    this.forceUpdate()
  }

  private handleNodeExpand = (node: ITreeNode) => {
    node.isExpanded = true
    this.forceUpdate()
  }

  handleDoubleClick(node) {
    console.log(node)
  }

  render() {
    return (
      <Tree
        contents={this.state.nodes}
        onNodeClick={this.handleNodeClick}
        onNodeDoubleClick={this.handleDoubleClick}
        onNodeCollapse={this.handleNodeCollapse}
        onNodeExpand={this.handleNodeExpand}
        onNodeContextMenu={this.handleContextMenu}
        className={Classes.ELEVATION_0}
      />
    )
  }
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect(
  mapStateToProps,
  undefined
)(LibraryList)
