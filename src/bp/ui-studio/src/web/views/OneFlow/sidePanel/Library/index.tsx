import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { LibraryElement } from 'common/typings'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { refreshLibrary, removeElementFromLibrary } from '~/actions'
import { traverseTree } from '~/util/tree_common'

import { buildFlowsTree } from './tree_util'

interface State {
  nodes: ITreeNode<LibraryElement>[]
}

class LibraryList extends Component<any> {
  state: State = {
    nodes: []
  }

  componentDidMount() {
    // tslint:disable-next-line: no-floating-promises
    this.updateFlows()
  }

  componentDidUpdate(prevProps) {
    if (this.props.filter !== prevProps.filter || this.props.library !== prevProps.library) {
      // tslint:disable-next-line: no-floating-promises
      this.updateFlows()
    }
  }

  async updateFlows() {
    if (!this.props.library?.length) {
      return
    }

    const nodes = buildFlowsTree(this.props.library, this.props.filter, {})

    if (this.props.filter) {
      traverseTree(nodes, n => (n.isExpanded = true))
    }

    this.setState({ nodes })
  }

  handleDelete = async itemId => {
    if (await confirmDialog(`Removing an element from your library doesn't delete it from your conte`, {})) {
      this.props.removeFromLibrary(itemId)
    }
  }

  handleContextMenu = (node: ITreeNode<LibraryElement>, path, e) => {
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
          onClick={() => {
            this.props.removeElementFromLibrary(node.nodeData.contentId)
            this.props.refreshLibrary()
          }}
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  private handleNodeClick = (node: ITreeNode<LibraryElement>) => {
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

const mapStateToProps = state => ({
  conditions: state.ndu.conditions,
  library: state.content.library
})

export default connect(mapStateToProps, { removeElementFromLibrary, refreshLibrary })(LibraryList)
