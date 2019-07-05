import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import { includes, isEqual } from 'lodash'
import React, { Component } from 'react'

import { buildFlowsTree } from './util'

export const FOLDER_ICON = 'folder-close'
export const DIRTY_ICON = 'clean'
export const FLOW_ICON = 'document'

export default class FlowsList extends Component<Props, State> {
  state = {
    nodes: [],
    activeNode: null
  }

  componentDidMount() {
    this.updateFlows()
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.flows, this.props.flows)) {
      this.updateFlows()
    }

    if (this.props.currentFlow && prevProps.currentFlow !== this.props.currentFlow) {
      this.traverseTree(this.state.nodes, (n: ITreeNode<NodeData>) => {
        return (n.isSelected = n.nodeData && n.nodeData.name === this.props.currentFlow['name'])
      })
    }

    if (this.props.dirtyFlows && prevProps.dirtyFlows !== this.props.dirtyFlows) {
      this.traverseTree(this.state.nodes, (node: ITreeNode<NodeData>) => {
        if (node.nodeData) {
          node.icon = this.props.dirtyFlows.includes(node.nodeData.name) ? DIRTY_ICON : FLOW_ICON
        }
      })
      this.forceUpdate()
    }
  }

  updateFlows() {
    this.setState({ nodes: buildFlowsTree(this.props.flows) })
  }

  handleDuplicate = flow => {
    let name = prompt('Enter the name of the new flow')

    if (!name) {
      return
    }

    name = name.replace(/\.flow\.json$/i, '')

    if (/[^A-Z0-9-_\/]/i.test(name)) {
      return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
    }

    if (includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
      return alert(`ERROR: The flow ${name} already exists`)
    }

    this.props.duplicateFlow({ flowNameToDuplicate: flow.name, name: `${name}.flow.json` })
  }

  handleRename = flow => {
    const name = window.prompt('Please enter the new name for that flow', flow.name.replace(/\.flow\.json$/i, ''))

    if (!name) {
      return
    }

    if (/[^A-Z0-9-_\/]/i.test(name)) {
      return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
    }

    if (name !== flow.name && includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
      return alert(`ERROR: The flow ${name} already exists`)
    }

    this.props.renameFlow({ targetFlow: flow.name, name: `${name}.flow.json` })
  }

  handleDelete = flow => {
    if (confirm(`Are you sure you want to delete the flow ${flow.name}?`) === true) {
      this.props.deleteFlow(flow.name)
    }
  }

  handleContextMenu = (node: ITreeNode<NodeData>, path, e) => {
    if (this.props.readOnly || !node.nodeData) {
      return null
    }

    e.preventDefault()

    ContextMenu.show(
      <Menu>
        <MenuItem
          disabled={node.nodeData.name === 'main.flow.json'}
          icon="edit"
          text="Rename"
          onClick={() => this.handleRename(node.nodeData)}
        />
        <MenuItem
          disabled={node.nodeData.name === 'main.flow.json'}
          icon="delete"
          text="Delete"
          onClick={() => this.handleDelete(node.nodeData)}
        />
        <MenuItem icon="duplicate" text="Duplicate" onClick={() => this.handleDuplicate(node.nodeData)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  private handleNodeClick = (node: ITreeNode<NodeData>) => {
    const originallySelected = node.isSelected

    this.traverseTree(this.state.nodes, n => (n.isSelected = false))

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
  currentFlow: any
  readOnly: boolean
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
