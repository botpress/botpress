import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import { confirmDialog, lang } from 'botpress/shared'
import { isEqual } from 'lodash'
import React, { Component } from 'react'

import { buildFlowsTree } from './util'

export const FOLDER_ICON = 'folder-close'
export const DIRTY_ICON = 'clean'
export const FLOW_ICON = 'document'
export const MAIN_FLOW_ICON = 'flow-end'
export const ERROR_FLOW_ICON = 'pivot'
export const TIMEOUT_ICON = 'time'

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

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.flows, this.props.flows)) {
      this.updateFlows()
    }

    if (this.props.currentFlow) {
      let parentPath = this.props.currentFlow.name
      parentPath = parentPath.substr(0, parentPath.lastIndexOf('/') + 1)

      traverseTree(this.state.nodes, (n: ITreeNode<NodeData>) => {
        if (parentPath.startsWith(n['fullPath'] + '/')) {
          n.isExpanded = true
        }
        n.isSelected = n.nodeData && n.nodeData.name === this.props.currentFlow.name
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

  handleDelete = async flow => {
    if (
      await confirmDialog(lang.tr('studio.flow.sidePanel.confirmDeleteFlow', { name: flow.name }), {
        acceptLabel: lang.tr('delete')
      })
    ) {
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
          text={lang.tr('rename')}
          onClick={() => this.props.renameFlow(node.nodeData.name)}
        />
        <MenuItem
          id="btn-duplicate"
          disabled={this.props.readOnly}
          icon="duplicate"
          text={lang.tr('duplicate')}
          onClick={() => this.props.duplicateFlow(node.nodeData.name)}
        />
        <MenuItem
          id="btn-delete"
          disabled={lockedFlows.includes(node.nodeData.name) || !this.props.canDelete || this.props.readOnly}
          icon="delete"
          text={lang.tr('delete')}
          onClick={() => this.handleDelete(node.nodeData)}
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
