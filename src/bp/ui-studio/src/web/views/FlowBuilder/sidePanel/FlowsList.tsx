import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import { includes, isEqual } from 'lodash'
import React, { Component } from 'react'

import { buildFlowsTree } from './util'

export const FOLDER_ICON = 'folder-close'
export const DIRTY_ICON = 'clean'
export const FLOW_ICON = 'document'
export const MAIN_FLOW_ICON = 'flow-end'
export const ERROR_FLOW_ICON = 'pivot'

const lockedFlows = ['main.flow.json', 'error.flow.json']

const traverseTree = (nodes: ITreeNode[], callback: (node: ITreeNode) => void) => {
  if (nodes == null) {
    return
  }

  for (const node of nodes) {
    callback(node)
    traverseTree(node.childNodes, callback)
  }
}

export default class FlowsList extends Component<Props, State> {
  state: State = {
    nodes: []
  }

  componentDidMount() {
    this.updateFlows()
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.flows, this.props.flows)) {
      this.updateFlows()
    }

    if (this.props.currentFlow && prevProps.currentFlow !== this.props.currentFlow) {
      traverseTree(this.state.nodes, (n: ITreeNode<NodeData>) => {
        return (n.isSelected = n.nodeData && n.nodeData.name === this.props.currentFlow['name'])
      })
    }

    if (this.props.filter !== prevProps.filter) {
      this.updateFlows()
    }
  }

  updateFlows() {
    const nodes = buildFlowsTree(this.props.flows, this.props.filter)

    if (this.props.filter) {
      traverseTree(nodes, n => (n.isExpanded = true))
    }

    this.setState({ nodes })
  }

  handleDelete = flow => {
    if (confirm(`Are you sure you want to delete the flow ${flow.name}?`)) {
      this.props.deleteFlow(flow.name)
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
          id="btn-rename"
          disabled={lockedFlows.includes(node.nodeData.name) || !this.props.canRename || this.props.readOnly}
          icon="edit"
          text="Rename"
          onClick={() => this.props.renameFlow(node.nodeData.name)}
        />
        <MenuItem
          id="btn-delete"
          disabled={lockedFlows.includes(node.nodeData.name) || !this.props.canDelete || this.props.readOnly}
          icon="delete"
          text="Delete"
          onClick={() => this.handleDelete(node.nodeData)}
        />
        <MenuItem
          id="btn-duplicate"
          disabled={this.props.readOnly}
          icon="duplicate"
          text="Duplicate"
          onClick={() => this.props.duplicateFlow(node.nodeData.name)}
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  private handleNodeClick = (node: ITreeNode<NodeData>) => {
    const originallySelected = node.isSelected

    traverseTree(this.state.nodes, n => (n.isSelected = false))

    node.isSelected = originallySelected !== null

    if (node.nodeData) {
      this.props.goToFlow(node.nodeData.name)
    } else {
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

  render() {
    return (
      <Tree
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
  filter: string
  readOnly: boolean
  currentFlow: any
  canRename: boolean
  canDelete: boolean
  dirtyFlows: string[]
  goToFlow: Function
  flows: any
  duplicateFlow: Function
  deleteFlow: Function
  renameFlow: Function
}

interface State {
  nodes: ITreeNode<NodeData>[]
}

interface NodeData {
  name: string
}
