import { Classes, ContextMenu, ITreeNode, Menu, MenuItem, Tree } from '@blueprintjs/core'
import React from 'react'

import { EditableFile } from '../../backend/typings'

import { buildTree } from './utils/tree'

export default class FileNavigator extends React.Component<Props, State> {
  state = {
    files: undefined,
    nodes: []
  }

  treeRef = undefined
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
        <MenuItem icon="edit" text="Rename" onClick={() => this.handleRename(node)} />
        <MenuItem icon="delete" text="Delete" onClick={() => this.props.onNodeDelete(node.nodeData as EditableFile)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  handleRename = (node: ITreeNode<NodeData>) => {
    const nodeDomElement = this.treeRef.current.getNodeContentElement(node.id)

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'bp3-input bp3-small'
    input.value = node.label as string

    const div = document.createElement('div')
    div.className = nodeDomElement.className
    div.appendChild(input)

    nodeDomElement.replaceWith(div)

    input.focus()
    input.select()

    const closeRename = async e => {
      e.preventDefault()
      div.replaceWith(nodeDomElement)
      window.removeEventListener('keydown', keyboardListener)
      window.removeEventListener('mousedown', mouseListener)

      const file = node.nodeData as EditableFile
      let newName = input.value as string
      newName = newName.endsWith('.js') ? newName : newName + '.js'

      if (newName === node.label) {
        return
      }

      try {
        await this.props.onNodeRename(file, newName)
      } catch (e) {
        return
      }

      node.label = newName
    }

    const keyboardListener = async e => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        await closeRename(e)
      }
    }

    const mouseListener = async e => {
      if (!div.contains(e.target)) {
        await closeRename(e)
      }
    }

    window.addEventListener('keydown', keyboardListener)
    window.addEventListener('mousedown', mouseListener)
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
