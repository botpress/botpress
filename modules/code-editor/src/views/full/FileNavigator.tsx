import {
  Classes,
  ContextMenu,
  Icon,
  ITreeNode,
  Menu,
  MenuDivider,
  MenuItem,
  Position,
  Tooltip,
  Tree
} from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { observe } from 'mobx'
import { inject, observer } from 'mobx-react'
import React from 'react'
import ReactDOM from 'react-dom'

import { EditableFile } from '../../backend/typings'
import { BOT_SCOPED_HOOKS } from '../../typings/hooks'

import { RootStore, StoreDef } from './store'
import { EditorStore } from './store/editor'
import style from './style.scss'
import { TreeNodeRenameInput } from './TreeNodeRenameInput'
import { buildTree, EXAMPLE_FOLDER_LABEL, FOLDER_EXAMPLE, FOLDER_ICON } from './utils/tree'

class FileNavigator extends React.Component<Props, State> {
  state = {
    files: undefined,
    nodes: []
  }

  treeRef: React.RefObject<Tree<NodeData>>
  constructor(props: Props) {
    super(props)
    this.treeRef = React.createRef()
  }

  componentDidMount() {
    observe(this.props.filters, 'filename', this.refreshNodes, true)
    observe(this.props.editor, 'fileChangeStatus', this.refreshNodes, true)
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.files && prevProps.files !== this.props.files) {
      this.refreshNodes()
    }
    if (this.props.selectedNode !== prevProps.selectedNode) {
      const { nodes } = this.state
      const selectedNode = this.props.selectedNode.replace(`${this.props.id}/`, '')
      this.traverseTree(nodes, n => (n.isSelected = selectedNode === n.id))
      this.setState({ nodes })
    }
  }

  refreshNodes = () => {
    if (!this.props.files) {
      return
    }

    const icons = {
      readOnly: (
        <Tooltip content={lang.tr('module.code-editor.navigator.isReadOnly')}>
          <Icon icon="lock" />
        </Tooltip>
      ),
      hasChanges: <Icon icon="record" />
    }

    const exampleLabel = (
      <Tooltip
        content={
          <span>
            {lang.tr('module.code-editor.navigator.codeSamples')}
            <br /> {lang.tr('module.code-editor.navigator.codeSamples2')}
            <br /> <br /> {lang.tr('module.code-editor.navigator.cannotBeEdited')}
          </span>
        }
        hoverOpenDelay={500}
        position={Position.BOTTOM}
      >
        <strong>{EXAMPLE_FOLDER_LABEL}</strong>
      </Tooltip>
    )

    const filter = this.props.filters && this.props.filters.filename.toLowerCase()
    const nodes: ITreeNode[] = this.props.files.map(dir => ({
      id: dir.label,
      label: dir.label === EXAMPLE_FOLDER_LABEL ? exampleLabel : dir.label,
      icon: dir.label === EXAMPLE_FOLDER_LABEL ? FOLDER_EXAMPLE : FOLDER_ICON,
      hasCaret: true,
      isExpanded: true,
      childNodes: buildTree(dir.files, this.props.expandedNodes, this.props.editor.openedFiles, filter, icons)
    }))

    // Examples are hidden by default so the view is not cluttered
    this.traverseTree(nodes, n => n.id === EXAMPLE_FOLDER_LABEL && (n.isExpanded = false))

    if (filter) {
      this.traverseTree(nodes, n => (n.isExpanded = true))
    }

    this.setState({ nodes })
  }

  private handleNodeClick = async (node: ITreeNode) => {
    this.traverseTree(this.state.nodes, n => (n.isSelected = n.id === node.id))

    // If nodeData is set, it's a file, otherwise a folder
    if (node.nodeData) {
      await this.props.editor.openFile(node.nodeData as EditableFile)
    } else {
      this.handleNodeExpand(node, !node.isExpanded)
    }
    this.props.onNodeStateSelected(this.props.id + '/' + node.id)
  }

  private handleNodeExpand = (node: ITreeNode, isExpanded: boolean) => {
    this.props.onNodeStateExpanded(node.id as string, isExpanded)
    node.isExpanded = isExpanded

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

    const file = node.nodeData as EditableFile

    if (this.props.contextMenuType === 'moduleConfig') {
      if (!file.botId) {
        ContextMenu.show(
          <Menu>
            <MenuItem
              id="btn-duplicateCurrent"
              icon="duplicate"
              text={lang.tr('module.code-editor.navigator.duplicateToCurrent')}
              onClick={() => this.props.duplicateFile(file, { forCurrentBot: true, keepSameName: true })}
            />
          </Menu>,
          { left: e.clientX, top: e.clientY }
        )
      } else {
        ContextMenu.show(
          <Menu>
            <MenuItem
              id="btn-menu-delete-file"
              icon="delete"
              text={lang.tr('delete')}
              onClick={() => this.props.deleteFile(file)}
            />
          </Menu>,
          { left: e.clientX, top: e.clientY }
        )
      }

      return
    }

    if (file.isExample) {
      if (file.type === 'action_legacy') {
        ContextMenu.show(
          <Menu>
            <MenuItem
              id="btn-duplicateCurrent"
              icon="duplicate"
              text={lang.tr('module.code-editor.navigator.copyExample')}
              onClick={() => this.props.duplicateFile(file, { forCurrentBot: true, keepSameName: true })}
            />
          </Menu>,
          { left: e.clientX, top: e.clientY }
        )
      } else if (file.type === 'hook') {
        ContextMenu.show(
          <Menu>
            {BOT_SCOPED_HOOKS.includes(file.hookType) && (
              <MenuItem
                id="btn-duplicateCurrent"
                icon="duplicate"
                text={lang.tr('module.code-editor.navigator.copyExample')}
                onClick={() => this.props.duplicateFile(file, { forCurrentBot: true, keepSameName: true })}
              />
            )}
            <MenuItem
              id="btn-duplicateCurrent"
              icon="duplicate"
              text={lang.tr('module.code-editor.navigator.copyExampleToHooks')}
              onClick={() => this.props.duplicateFile(file, { forCurrentBot: false, keepSameName: true })}
            />
          </Menu>,
          { left: e.clientX, top: e.clientY }
        )
      }

      return
    }

    const isDisabled = file.name.startsWith('.')
    const canMove = this.props.store.editor.isAdvanced && this.props.moveFile

    ContextMenu.show(
      <Menu>
        {canMove ? (
          <MenuItem
            id="btn-move"
            icon="edit"
            text={lang.tr('module.code-editor.navigator.renameMove')}
            onClick={() => this.props.moveFile(file)}
          />
        ) : (
          <MenuItem id="btn-rename" icon="edit" text={lang.tr('rename')} onClick={() => this.renameTreeNode(node)} />
        )}
        <MenuItem
          id="btn-delete-file"
          icon="delete"
          text={lang.tr('delete')}
          onClick={() => this.props.deleteFile(file)}
        />
        <MenuDivider />
        <MenuItem
          id="btn-duplicate"
          icon="duplicate"
          text={lang.tr('duplicate')}
          onClick={() => this.props.duplicateFile(file)}
        />
        <MenuItem
          id="btn-download"
          icon="download"
          text={lang.tr('download')}
          onClick={() => this.props.store.api.downloadFile(file)}
        />
        <MenuDivider />
        {isDisabled ? (
          <MenuItem
            id="btn-enable"
            icon="endorsed"
            text={lang.tr('enable')}
            onClick={() => this.props.enableFile(file)}
          />
        ) : (
          <MenuItem
            id="btn-disable"
            icon="disable"
            text={lang.tr('disable')}
            onClick={() => this.props.disableFile(file)}
          />
        )}
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
    if (!this.state.nodes.length) {
      return <div className={style.padding}>{lang.tr('module.code-editor.navigator.noFilesFound')}</div>
    }

    return (
      <Tree
        ref={this.treeRef}
        contents={this.state.nodes}
        onNodeContextMenu={this.handleContextMenu}
        onNodeClick={this.handleNodeClick}
        onNodeCollapse={n => this.handleNodeExpand(n, false)}
        onNodeExpand={n => this.handleNodeExpand(n, true)}
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
  duplicateFile: store.duplicateFile
}))(observer(FileNavigator))

type Props = {
  id: string
  files: any
  store?: RootStore
  editor?: EditorStore
  disableContextMenu?: boolean
  contextMenuType?: string
  onNodeStateExpanded: (id: string, isExpanded: boolean) => void
  onNodeStateSelected: (fullyQualifiedId: string) => void
  moveFile?: (file: any) => void
  expandedNodes: object
  selectedNode: string
} & Pick<StoreDef, 'filters' | 'deleteFile' | 'renameFile' | 'disableFile' | 'enableFile' | 'duplicateFile'>

interface State {
  nodes: ITreeNode[]
}

interface NodeData {
  name: string
}
