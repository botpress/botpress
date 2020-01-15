import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import { isEqual } from 'lodash'
import React, { Component } from 'react'
import { traverseTree } from '~/util/tree_common'

import { buildFlowsTree } from './tree_util'

const lockedFlows = ['main.flow.json', 'error.flow.json']

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
    const actions = {
      createGoal: this.props.createGoal,
      editTopic: this.props.editTopic
    }

    const flows = this.props.flows.filter(x => x.name !== 'main.flow.json')
    const nodes = buildFlowsTree(flows, this.props.filter, actions)

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
        <MenuItem
          id="btn-export"
          disabled={this.props.readOnly}
          icon="export"
          text="Export"
          onClick={() => this.props.exportGoal(node.nodeData.name)}
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

    if (node.nodeData) {
      this.props.goToFlow(node.nodeData.name)
    } else {
      node.isExpanded ? this.handleNodeCollapse(node) : this.handleNodeExpand(node)
    }

    this.forceUpdate()
  }

  private handleNodeDoubleClick = (node: ITreeNode<NodeData>) => {
    if (node.nodeData) {
      this.props.editGoal(node.label, node.nodeData)
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
        onNodeDoubleClick={this.handleNodeDoubleClick}
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
  currentFlow: Flow

  canDelete: boolean
  goToFlow: Function
  flows: { name: string }[]

  duplicateFlow: Function
  deleteFlow: Function
  exportGoal: Function

  createGoal: (topicId: string) => void
  editGoal: (goalId: any, data: any) => void
  editTopic: (topicName: string) => void
}

interface State {
  nodes: ITreeNode<NodeData>[]
}

interface NodeData {
  name: string
}
