import { Classes, ContextMenu, ITreeNode, Menu, MenuDivider, MenuItem, Tree } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import { isEqual } from 'lodash'
import React, { Component } from 'react'
import { traverseTree } from '~/util/tree_common'

import { buildFlowsTree } from './tree_util'

const lockedFlows = ['main.flow.json', 'error.flow.json']

export const TYPE_TOPIC = 'topic'
export const TYPES = {
  Topic: 'topic',
  Goal: 'goal',
  Folder: 'folder'
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

  importGoal: (topicId: string) => void
  createGoal: (topicId: string) => void
  editGoal: (goalId: any, data: any) => void
  editTopic: (topicName: string) => void
  exportTopic: (topicName: string) => void
}

interface State {
  nodes: ITreeNode<NodeData>[]
}

interface NodeData {
  name: string
  type: 'goal' | 'folder' | 'topic'
  label?: string
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
    const actions = {
      createGoal: this.props.createGoal,
      editTopic: this.props.editTopic,
      importGoal: this.props.importGoal
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
    const { name, type } = node.nodeData

    e.preventDefault()

    if (type === TYPES.Topic) {
      ContextMenu.show(
        <Menu>
          <MenuItem
            id="btn-edit"
            icon="edit"
            text="Edit Topic"
            onClick={() => this.props.editTopic(node.id as string)}
          />
          <MenuItem
            id="btn-export"
            disabled={this.props.readOnly}
            icon="upload"
            text="Export Topic"
            onClick={() => this.props.exportTopic(node.id as string)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-create"
            disabled={this.props.readOnly}
            icon="add"
            text="Create new Goal"
            onClick={() => this.props.createGoal(name)}
          />
          <MenuItem
            id="btn-import"
            disabled={this.props.readOnly}
            icon="download"
            text="Import existing Goal"
            onClick={() => this.props.importGoal(name)}
          />
        </Menu>,
        { left: e.clientX, top: e.clientY }
      )
    } else if (type === TYPES.Goal) {
      ContextMenu.show(
        <Menu>
          <MenuItem
            id="btn-edit"
            disabled={this.props.readOnly}
            icon="edit"
            text="Edit Goal"
            onClick={() => this.props.editGoal(name, node.nodeData)}
          />
          <MenuItem
            id="btn-duplicate"
            disabled={this.props.readOnly}
            icon="duplicate"
            text="Duplicate"
            onClick={() => this.props.duplicateFlow(name)}
          />
          <MenuItem
            id="btn-export"
            disabled={this.props.readOnly}
            icon="export"
            text="Export"
            onClick={() => this.props.exportGoal(name)}
          />
          <MenuDivider />
          <MenuItem
            id="btn-delete"
            disabled={lockedFlows.includes(name) || !this.props.canDelete || this.props.readOnly}
            icon="delete"
            text="Delete"
            onClick={() => this.handleDelete(node.nodeData)}
          />
        </Menu>,
        { left: e.clientX, top: e.clientY }
      )
    }
  }

  private handleNodeClick = (node: ITreeNode<NodeData>) => {
    const { type, name } = node.nodeData
    const originallySelected = node.isSelected

    traverseTree(this.state.nodes, n => (n.isSelected = false))

    if (type !== TYPES.Topic && type !== TYPES.Folder) {
      node.isSelected = originallySelected !== null
    }

    if (type === TYPES.Goal) {
      this.props.goToFlow(name)
    } else {
      node.isExpanded ? this.handleNodeCollapse(node) : this.handleNodeExpand(node)
    }

    this.forceUpdate()
  }

  private handleNodeDoubleClick = (node: ITreeNode<NodeData>) => {
    if (node.nodeData.type === TYPES.Goal) {
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
