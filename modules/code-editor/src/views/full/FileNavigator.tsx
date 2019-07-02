import { Classes, ContextMenu, ITreeNode, Menu, MenuDivider, MenuItem, Tree } from '@blueprintjs/core'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'
import ReactDOM from 'react-dom'

import { EditableFile } from '../../backend/typings'

import { RootStore, StoreDef } from './store'
import { EditorStore } from './store/editor'
import { buildTree } from './utils/tree'
import { TreeNodeRenameInput } from './TreeNodeRenameInput'

class FileNavigator extends React.Component<Props, State> {
  state = {
    files: undefined,
    nodes: []
  }

  treeRef: React.RefObject<Tree<NodeData>>
  constructor(props) {
    super(props)
    this.treeRef = React.createRef()
  }

  componentDidMount() {
    observe(this.props.filters, 'filename', this.refreshNodes, true)
  }

  componentDidUpdate(prevProps) {
    if (this.props.files && prevProps.files !== this.props.files) {
      this.refreshNodes()
    }
  }

  refreshNodes = () => {
    if (!this.props.files) {
      return
    }
    const filter = this.props.filters && this.props.filters.filename.toLowerCase()
    const nodes: ITreeNode[] = this.props.files.map(dir => ({
      id: dir.label,
      label: dir.label,
      icon: 'folder-close',
      hasCaret: true,
      isExpanded: true,
      childNodes: buildTree(dir.files, this.props.expandedNodes, filter)
    }))

    this.setState({ nodes })
  }

  private handleNodeClick = (node: ITreeNode) => {
    const originallySelected = node.isSelected
    this.traverseTree(this.state.nodes, n => (n.isSelected = false))
    node.isSelected = originallySelected !== null

    // If nodeData is set, it's a file, otherwise a folder
    if (node.nodeData) {
      this.props.editor.openFile(node.nodeData as EditableFile)
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
    e.preventDefault()

    if (!node.nodeData || this.props.disableContextMenu) {
      return null
    }

    const isDisabled = node.nodeData.name.startsWith('.')
    const file = node.nodeData as EditableFile

    ContextMenu.show(
      <Menu>
        <MenuItem icon="edit" text="Rename" onClick={() => this.renameTreeNode(node)} />
        <MenuItem icon="delete" text="Delete" onClick={() => this.props.deleteFile(file)} />
        <MenuDivider />
        <MenuItem icon="duplicate" text="Duplicate" onClick={() => this.props.duplicateFile(file)} />
        <MenuDivider />
        <MenuItem icon="endorsed" text="Enable" disabled={!isDisabled} onClick={() => this.props.enableFile(file)} />
        <MenuItem icon="disable" text="Disable" disabled={isDisabled} onClick={() => this.props.disableFile(file)} />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  renameTreeNode = async (node: ITreeNode) => {
    const nodeDomElement = this.treeRef.current.getNodeContentElement(node.id)
    const renamer = document.createElement('div')

    const handleCloseComponent = async (newName: string, cancel: boolean) => {
      ReactDOM.unmountComponentAtNode(renamer)
      renamer.replaceWith(nodeDomElement)

      if (cancel || !newName || !newName.length || newName === node.label) {
        return
      }

      try {
        await this.props.renameFile(node.nodeData as EditableFile, newName)
      } catch (err) {
        console.error('could not rename file')
        return
      }

      node.label = newName
    }

    ReactDOM.render(
      <TreeNodeRenameInput node={node} nodeDomElement={nodeDomElement} handleCloseComponent={handleCloseComponent} />,
      renamer
    )
    nodeDomElement.replaceWith(renamer)
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

export default inject(({ store }: { store: RootStore }) => ({
  store,
  editor: store.editor,
  filters: store.filters,
  deleteFile: store.deleteFile,
  renameFile: store.renameFile,
  enableFile: store.enableFile,
  disableFile: store.disableFile,
  duplicateFile: store.duplicateFile,
  isGlobalAllowed: store.config && store.config.isGlobalAllowed
}))(observer(FileNavigator))

type Props = {
  files: any
  store?: RootStore
  editor?: EditorStore
  disableContextMenu?: boolean
  onNodeStateChanged: (id: string, isExpanded: boolean) => void
  expandedNodes: object
} & Pick<StoreDef, 'filters' | 'deleteFile' | 'renameFile' | 'disableFile' | 'enableFile' | 'duplicateFile'>

interface State {
  nodes: ITreeNode[]
}

interface NodeData {
  name: string
}
