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
import { BulkAction, KeyPosition } from './typings'
import { buildTree, EXAMPLE_FOLDER_LABEL, FOLDER_EXAMPLE, FOLDER_ICON } from './utils/tree'

class FileNavigator extends React.Component<Props, State> {
  state: State = {
    files: undefined,
    nodes: [],
    action: undefined,
    selectedFiles: {},
    clipboard: {},
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

  private storeAction(action: BulkAction) {
    this.setState((prevState: State) => {
      return {
        action,
        clipboard: prevState.selectedFiles
      }
    })
  }

  private get selectedFilesCount(): number {
    return Object.keys(this.state.selectedFiles).length
  }

  private getNodeParent(node: ITreeNode): ITreeNode {
    let nodeParentId: string = 'Data'
    let nodeParent: ITreeNode
    const chunks = (node.id as string).split('/')

    if (chunks && chunks.length > 1){
      nodeParentId = chunks.slice(0, -1).join('/')
    }

    this.traverseTree(this.state.nodes, n => {
      if (!node.nodeData || n.id !== nodeParentId) {
        return
      }

      nodeParent = n
    })

    return nodeParent
  }

  private handleNodeClick = async (node: ITreeNode) => {
    if (node.nodeData && this.props.keyStates.action === KeyPosition.DOWN) {
      this.handleActionClick(node)
      return
    }

    if (node.nodeData && this.props.keyStates.shift === KeyPosition.DOWN) {
      this.handleShiftClick(node)
      return
    }

    await this.handleSingleNodeSelectedClick(node)
  }

  private static isNodeIdInRange(currentNodeId: string, firstNodeId: string, lastNodeId: string): boolean{
    let tempId: string
    if (firstNodeId >= lastNodeId){
      tempId = lastNodeId
      lastNodeId = firstNodeId
      firstNodeId = tempId
    }

    return currentNodeId >= firstNodeId && currentNodeId <= lastNodeId
  }

  private handleShiftClick(node: ITreeNode<{}>) {
    const selectedFiles = {}
    const sameLevelNodes: ITreeNode[] = this.getNodeParent(node)?.childNodes
    const firstSelectedNodeId = this.selectedFilesCount ? Object.keys(this.state.selectedFiles)[0] : null

    if (this.selectedFilesCount){
      this.traverseTree(this.state.nodes, (n: ITreeNode) => {
        if (!n.nodeData || !this.state.selectedFiles[n.id]) {
          return
        }

        n.isSelected = false
      })
    }

    sameLevelNodes.forEach((n: ITreeNode) => {
      if(!n.nodeData || !FileNavigator.isNodeIdInRange(n.id as string, firstSelectedNodeId, node.id as string)){
        return
      }

      n.isSelected = true
      selectedFiles[n.id] = n
    })

    this.setState({ selectedFiles })
    this.forceUpdate()
  }

  private handleActionClick(node: ITreeNode<{}>) {
    this.traverseTree(this.state.nodes, n => {
      if (!node.nodeData || n.id !== node.id) {
        return
      }

      if (!this.state.selectedFiles[n.id]) {
        const { selectedFiles } = this.state

        n.isSelected = true
        selectedFiles[n.id] = n.nodeData as EditableFile

        this.setState({
          selectedFiles
        })
      } else {
        n.isSelected = false
        this.setState((prevState: State) => {
          return {
            ...prevState,
            selectedFiles: {
              ...prevState.selectedFiles,
              [n.id]: undefined
            }
          }
        })
      }

      return n
    })

    this.forceUpdate()

    if (!node.nodeData) {
      this.handleNodeExpand(node, !node.isExpanded)
    }
  }

  private async handleSingleNodeSelectedClick(node: ITreeNode) {
    this.traverseTree(this.state.nodes, n => (n.isSelected = n.id === node.id))
    this.forceUpdate()

    // If nodeData is set, it's a file, otherwise a folder
    if (node.nodeData) {
      await this.props.editor.openFile(node.nodeData as EditableFile)

      this.setState({
        selectedFiles: {
          [node.id]: node.nodeData
        } as { [key: string]: EditableFile },
        action: undefined
      })
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

    const bulkMenuItems = () => {
      return <>
        <MenuItem
          id="btn-copy"
          icon="duplicate"
          text={lang.tr('module.code-editor.navigator.copy')}
          onClick={() => this.storeAction('copy')}
        />
        <MenuItem
          id="btn-cut"
          icon="cut"
          text={lang.tr('module.code-editor.navigator.cutOrMove')}
          onClick={() => this.storeAction('cut')}
        />
      </>
    }

    // if multiple file selected and on selected file
    console.log(this.selectedFilesCount, this.state.selectedFiles)
    if (this.selectedFilesCount > 1 && this.state.selectedFiles[node.id]){
      ContextMenu.show(
        <Menu>
          {bulkMenuItems()}
        </Menu>,
        { left: e.clientX, top: e.clientY }
      )
      return
    }

    // if multiple file selected and folder
    if (!node.nodeData || this.props.disableContextMenu) {
      const { selectedFiles, action } = this.state

      if (this.selectedFilesCount && action) {
        ContextMenu.show(
          <Menu>
            <MenuItem
              id="btn-paste"
              icon="clipboard"
              text={lang.tr('module.code-editor.navigator.paste')}
              onClick={() => this.props.executeBulkAction(action, Object.values(selectedFiles), node.id as string)}
            />
          </Menu>,
          { left: e.clientX, top: e.clientY }
        )
        return
      }
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
              id="btn-delete"
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
    const canSupportBulkActions = this.state.selectedFiles[node.id]

    ContextMenu.show(
      <Menu>
        {canSupportBulkActions && (
          <>
            {bulkMenuItems()}
            <MenuDivider />
          </>
        )}
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
        <MenuItem id="btn-delete" icon="delete" text={lang.tr('delete')} onClick={() => this.props.deleteFile(file)} />
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
  keyStates: store.keyStates,
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
  isMultipleCutActive?: boolean
  onNodeStateExpanded: (id: string, isExpanded: boolean) => void
  onNodeStateSelected: (fullyQualifiedId: string) => void
  executeBulkAction?: (action: BulkAction, files: EditableFile[], folderName: string) => void
  moveFile?: (file: any) => void
  expandedNodes: object
  selectedNode: string
} & Pick<StoreDef, 'keyStates' | 'filters' | 'deleteFile' | 'renameFile' | 'disableFile' | 'enableFile' | 'duplicateFile'>

interface State {
  files: any
  nodes: ITreeNode[]
  action: BulkAction
  selectedFiles: { [key: string]: EditableFile }
  clipboard: { [key: string]: EditableFile }
}

interface NodeData {
  name: string
}
