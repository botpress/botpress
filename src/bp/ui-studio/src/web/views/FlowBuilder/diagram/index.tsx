import {
  Button,
  ContextMenu,
  ControlGroup,
  InputGroup,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Position,
  Tag,
  Toaster
} from '@blueprintjs/core'
import { IO } from 'botpress/sdk'
import { contextMenu, Icons, lang, MainLayout, sharedStyle, ShortcutLabel } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import {
  DefaultLinkModel,
  DefaultPortModel,
  DiagramEngine,
  DiagramWidget,
  NodeModel,
  PointModel
} from 'storm-react-diagrams'
import {
  buildNewSkill,
  closeFlowNodeProps,
  copyFlowNode,
  createFlow,
  createFlowNode,
  fetchFlows,
  insertNewSkillNode,
  openFlowNodeProps,
  pasteFlowNode,
  refreshFlowsLinks,
  removeFlowNode,
  setDiagramAction,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems,
  zoomToLevel
} from '~/actions'
import { SearchBar } from '~/components/Shared/Interface'
import { getAllFlows, getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'
import storage from '~/util/storage'

import { prepareEventForDiagram } from './debugger'
import DiagramToolbar from './DiagramToolbar'
import { defaultTransition, DiagramManager, DIAGRAM_PADDING, nodeTypes, Point } from './manager'
import { BlockModel, BlockProps, BlockWidgetFactory } from './nodes/Block'
import { DeletableLinkFactory } from './nodes/LinkWidget'
import NodeToolbar from './NodeToolbar'
import style from './style.scss'
import TriggerEditor from './TriggerEditor'
import WorkflowToolbar from './WorkflowToolbar'
import ZoomToolbar from './ZoomToolbar'

interface OwnProps {
  childRef: (el: any) => void
  readOnly: boolean
  canPasteNode: boolean
  selectedTopic: string
  selectedWorkflow: string
  highlightFilter: string
  showSearch: boolean
  hideSearch: () => void
  currentLang: string
  setCurrentLang: (lang: string) => void
  languages: string[]
  defaultLang: string
  mutexInfo: string
  handleFilterChanged: (event: any) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

export type ExtendedDiagramEngine = {
  enableLinkPoints?: boolean
  flowBuilder?: Diagram
} & DiagramEngine

const EXPANDED_NODES_KEY = `bp::${window.BOT_ID}::expandedNodes`
export const MAX_NUMBER_OF_POINTS_PER_LINK = 3

const getExpandedNodes = () => {
  try {
    return JSON.parse(storage.get(EXPANDED_NODES_KEY) || '[]')
  } catch (error) {
    return []
  }
}

class Diagram extends Component<Props> {
  private diagramEngine: ExtendedDiagramEngine
  private diagramWidget: DiagramWidget
  private diagramContainer: HTMLDivElement
  public manager: DiagramManager
  /** Represents the source port clicked when the user is connecting a node */
  private dragPortSource: any

  state = {
    expandedNodes: [],
    nodeInfos: [],
    currentTriggerNode: null,
    isTriggerEditOpen: false
  }

  constructor(props) {
    super(props)

    const commonProps: BlockProps = {
      node: undefined,
      selectedNodeItem: () => this.getPropsProperty('activeFormItem'),
      deleteSelectedElements: this.deleteSelectedElements.bind(this),
      copySelectedElement: this.copySelectedElement.bind(this),
      getCurrentFlow: () => this.getPropsProperty('currentFlow'),
      updateFlowNode: this.updateNodeAndRefresh.bind(this),
      switchFlowNode: this.switchFlowNode.bind(this),
      updateFlow: this.getPropsProperty('updateFlow'),
      getLanguage: () => ({
        currentLang: this.getPropsProperty('currentLang'),
        defaultLang: this.getPropsProperty('defaultLang')
      }),
      getConditions: () => this.getPropsProperty('conditions'),
      getExpandedNodes: () => this.getStateProperty('expandedNodes'),
      setExpandedNodes: this.updateExpandedNodes.bind(this),
      editTriggers: this.editTriggers.bind(this),
      getDebugInfo: this.getDebugInfo,
      getFlows: () => this.getPropsProperty('flows'),
      getSkills: () => this.getPropsProperty('skills'),
      disconnectNode: this.disconnectNode.bind(this),
      // Temporary, maybe we could open the elementinstead of double-click?
      // eslint-disable-next-line no-console
      editNodeItem: (node, idx) => console.log(node, idx)
    }

    this.diagramEngine = new DiagramEngine()
    this.diagramEngine.registerNodeFactory(new BlockWidgetFactory(commonProps))
    this.diagramEngine.registerLinkFactory(new DeletableLinkFactory())

    // This reference allows us to update flow nodes from widgets
    this.diagramEngine.flowBuilder = this
    this.manager = new DiagramManager(this.diagramEngine, {
      switchFlowNode: this.props.switchFlowNode,
      openFlowNodeProps: this.props.openFlowNodeProps,
      zoomToLevel: this.props.zoomToLevel
    })

    if (this.props.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
    }
  }

  getStateProperty(propertyName: string) {
    return this.state[propertyName]
  }

  getPropsProperty(propertyName: string) {
    return this.props[propertyName]
  }

  switchFlowNode(nodeId: string) {
    this.props.switchFlowNode(nodeId)
  }

  updateNodeAndRefresh(args) {
    this.props.updateFlowNode({ ...args })
    this.props.refreshFlowsLinks()
  }

  updateExpandedNodes(nodeId: string, expanded: boolean): void {
    const expandedNodes = this.state.expandedNodes.filter(id => id !== nodeId)

    if (expanded) {
      expandedNodes.push(nodeId)
    }

    storage.set(EXPANDED_NODES_KEY, JSON.stringify(expandedNodes))
    this.setState({ expandedNodes })
  }

  copySelectedElement(nodeId: string) {
    this.props.switchFlowNode(nodeId)
    this.copySelectedElementToBuffer()
  }

  disconnectNode(node) {
    this.manager.disconnectPorts(node)
    this.checkForLinksUpdate()
  }

  getDebugInfo = (nodeName: string) => {
    return (this.state.nodeInfos ?? [])
      .filter(x => x.workflow === this.props.currentFlow?.name.replace('.flow.json', ''))
      .find(x => x?.node === nodeName)
  }

  showEventOnDiagram(event?: IO.IncomingEvent) {
    if (!event) {
      this.manager.setHighlightedNodes([])
      this.setState({ nodeInfos: [] })
      return
    }

    const { flows } = this.props
    const { nodeInfos, highlightedNodes } = prepareEventForDiagram(event, flows)

    this.manager.setHighlightedNodes(highlightedNodes)
    this.manager.highlightLinkedNodes()
    this.setState({ nodeInfos })

    if (highlightedNodes.length) {
      const firstFlow = highlightedNodes[0].flow

      if (this.props.currentFlow?.name !== firstFlow) {
        this.props.switchFlow(firstFlow)
      }
    }
  }

  componentDidMount() {
    this.props.fetchFlows()
    this.setState({ expandedNodes: getExpandedNodes() })

    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('click', this.onDiagramClick)
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('dblclick', this.onDiagramDoubleClick)
    document.getElementById('diagramContainer').addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('click', this.onDiagramClick)
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('dblclick', this.onDiagramDoubleClick)
    document.getElementById('diagramContainer').removeEventListener('keydown', this.onKeyDown)
  }

  componentDidUpdate(prevProps, prevState) {
    this.manager.setCurrentFlow(this.props.currentFlow)
    this.manager.setReadOnly(this.props.readOnly)

    if (this.diagramContainer) {
      this.manager.setDiagramContainer(this.diagramWidget, {
        width: this.diagramContainer.offsetWidth,
        height: this.diagramContainer.offsetHeight
      })
    }

    if (this.dragPortSource && !prevProps.currentFlowNode && this.props.currentFlowNode) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.linkCreatedNode()
    }

    if (prevProps.zoomLevel !== this.props.zoomLevel) {
      this.diagramEngine.diagramModel.setZoomLevel(this.props.zoomLevel)
    }

    if (prevProps.debuggerEvent !== this.props.debuggerEvent) {
      this.showEventOnDiagram(this.props.debuggerEvent)
    }

    const isDifferentFlow = _.get(prevProps, 'currentFlow.name') !== _.get(this, 'props.currentFlow.name')

    if (!this.props.currentFlow) {
      this.manager.clearModel()
    } else if (!prevProps.currentFlow || isDifferentFlow) {
      // Update the diagram model only if we changed the current flow
      this.manager.initializeModel()
      this.checkForProblems()
    } else {
      // Update the current model with the new properties
      this.manager.syncModel()
    }

    // Refresh nodes when the filter is displayed
    if (this.props.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
      this.manager.syncModel()
    }

    // Refresh nodes when the filter is updated
    if (this.props.highlightFilter !== prevProps.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
      this.manager.syncModel()
    }
  }

  updateTransitionNode = async (nodeId: string, index: number, newName: string) => {
    await this.props.switchFlowNode(nodeId)
    const next = this.props.currentFlowNode.next

    if (!next.length) {
      this.props.updateFlowNode({ next: [{ condition: 'true', node: newName }] })
    } else {
      await this.props.updateFlowNode({
        next: Object.assign([], next, { [index]: { ...next[index], node: newName } })
      })
    }

    this.checkForLinksUpdate()
    this.diagramWidget.forceUpdate()
  }

  linkCreatedNode = async () => {
    const sourcePort: DefaultPortModel = _.get(this.dragPortSource, 'parent.sourcePort')
    this.dragPortSource = undefined

    if (!sourcePort || sourcePort.parent.id === this.props.currentFlowNode.id) {
      return
    }

    if (!sourcePort.in) {
      const sourcePortIndex = Number(sourcePort.name.replace('out', ''))
      await this.updateTransitionNode(sourcePort.parent.id, sourcePortIndex, this.props.currentFlowNode.name)
    } else {
      await this.updateTransitionNode(this.props.currentFlowNode.id, 0, sourcePort.parent['name'])
    }
  }

  add = {
    flowNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'standard', next: [defaultTransition] }),
    skillNode: (point: Point, skillId: string) => this.props.buildSkill({ location: point, id: skillId }),
    triggerNode: (point: Point) => {
      this.props.createFlowNode({ ...point, type: 'trigger', conditions: [], next: [defaultTransition] })
    },
    sayNode: (point: Point) => {
      this.props.createFlowNode({
        ...point,
        type: 'say_something',
        content: { contentType: 'builtin_text', formData: {} },
        next: [defaultTransition]
      })
    },
    executeNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'execute', next: [defaultTransition] }),
    listenNode: (point: Point) =>
      this.props.createFlowNode({ ...point, type: 'listen', onReceive: [], next: [defaultTransition] }),
    routerNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'router' }),
    actionNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'action', next: [defaultTransition] })
  }

  onDiagramDoubleClick = (event?: MouseEvent) => {
    if (!event) {
      return
    }

    const target = this.diagramWidget.getMouseElement(event)

    if (target?.model?.['nodeType'] === 'trigger') {
      this.editTriggers(target.model)
    }

    this.props.switchFlowNode(null)
    this.props.closeFlowNodeProps()
  }

  handleContextMenuNoElement = (event: React.MouseEvent) => {
    const point = this.manager.getRealPosition(event)
    const originatesFromOutPort = _.get(this.dragPortSource, 'parent.sourcePort.name', '').startsWith('out')

    // When no element is chosen from the context menu, we reset the start port so it doesn't impact the next selected node
    let clearStartPortOnClose = true

    const wrap = (addNodeMethod, ...args) => () => {
      clearStartPortOnClose = false
      addNodeMethod(...args)
    }

    contextMenu(
      event,
      <Menu>
        {this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        <MenuDivider title={lang.tr('studio.flow.addNode')} />
        <MenuItem
          text={lang.tr('studio.flow.nodeType.standard')}
          onClick={wrap(this.add.flowNode, point)}
          icon="chat"
        />
        {(window.USE_ONEFLOW || window.EXPERIMENTAL) && (
          <Fragment>
            {!originatesFromOutPort && window.USE_ONEFLOW && (
              <MenuItem
                text={lang.tr('studio.flow.nodeType.trigger')}
                onClick={wrap(this.add.triggerNode, point)}
                icon="send-to-graph"
              />
            )}
            <MenuItem text={lang.tr('say')} onClick={wrap(this.add.sayNode, point)} icon={<Icons.Say />} />
            <MenuItem text={lang.tr('execute')} onClick={wrap(this.add.executeNode, point)} icon="code" />
            <MenuItem text={lang.tr('listen')} onClick={wrap(this.add.listenNode, point)} icon="hand" />
            <MenuItem text={lang.tr('router')} onClick={wrap(this.add.routerNode, point)} icon="fork" />
            <MenuItem text={lang.tr('action')} onClick={wrap(this.add.actionNode, point)} icon="offline" />
          </Fragment>
        )}

        <MenuItem tagName="button" text={lang.tr('skills')} icon="add">
          {this.props.skills.map(skill => (
            <MenuItem
              key={skill.id}
              text={lang.tr(skill.name)}
              tagName="button"
              onClick={wrap(this.add.skillNode, point, skill.id)}
              icon={skill.icon}
            />
          ))}
        </MenuItem>
      </Menu>,
      () => {
        if (clearStartPortOnClose) {
          this.dragPortSource = undefined
        }
      }
    )
  }

  handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()

    const target = this.diagramWidget.getMouseElement(event)
    if (!target && !this.props.readOnly) {
      this.handleContextMenuNoElement(event)
      return
    }

    const targetModel = target?.model
    const targetName = _.get(target, 'model.name')
    const point = this.manager.getRealPosition(event)

    const canMakeStartNode = () => {
      const current = this.props.currentFlow && this.props.currentFlow.startNode
      return current && targetName && current !== targetName
    }

    const setAsCurrentNode = () => this.props.updateFlow({ startNode: targetName })
    const isStartNode = targetName === this.props.currentFlow.startNode
    const isNodeTargeted = targetModel instanceof NodeModel

    // Prevents displaying an empty menu
    if ((!isNodeTargeted && !this.props.canPasteNode) || this.props.readOnly) {
      return
    }

    contextMenu(
      event,
      <Menu>
        {!isNodeTargeted && this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        {isNodeTargeted && (
          <Fragment>
            <MenuItem
              icon="trash"
              intent={Intent.DANGER}
              text={
                <div className={sharedStyle.contextMenuLabel}>
                  {lang.tr('delete')}
                  <ShortcutLabel light keys={['backspace']} />
                </div>
              }
              disabled={isStartNode}
              onClick={() => this.deleteSelectedElements()}
            />
            <MenuItem
              icon="duplicate"
              text={lang.tr('copy')}
              onClick={() => {
                this.props.switchFlowNode(targetModel.id)
                this.copySelectedElementToBuffer()
              }}
            />
            <MenuDivider />
            <MenuItem
              icon="star"
              text={lang.tr('studio.flow.setAsStart')}
              disabled={!canMakeStartNode()}
              onClick={() => setAsCurrentNode()}
            />
            <MenuItem
              icon="minimize"
              text={lang.tr('studio.flow.disconnectNode')}
              onClick={() => {
                this.manager.disconnectPorts(targetModel)
                this.checkForLinksUpdate()
              }}
            />
          </Fragment>
        )}
      </Menu>
    )
  }

  checkForProblems = _.debounce(() => {
    this.props.updateFlowProblems(this.manager.getNodeProblems())
  }, 500)

  createFlow(name: string) {
    this.props.createFlow(`${name}.flow.json`)
  }

  canTargetOpenInspector = target => {
    if (!target) {
      return false
    }

    const nodeType = target.model?.nodeType
    return (
      nodeType === 'router' ||
      nodeType === 'say_something' ||
      nodeType === 'standard' ||
      nodeType === 'skill-call' ||
      nodeType === 'execute' ||
      nodeType === 'trigger' ||
      nodeType === 'failure' ||
      nodeType === 'listen' ||
      nodeType === 'action'
    )
  }

  onDiagramClick = (event: MouseEvent) => {
    const selectedNode = this.manager.getSelectedNode() as BlockModel
    const currentNode = this.props.currentFlowNode
    const target = this.diagramWidget.getMouseElement(event)

    this.manager.sanitizeLinks()
    this.manager.cleanPortLinks()

    // skip when a link is selected
    if (selectedNode && selectedNode instanceof DefaultLinkModel) {
      return
    }

    // only when creating a link
    if (selectedNode && selectedNode instanceof PointModel && selectedNode.parent.points.length <= 2) {
      this.dragPortSource = selectedNode
      this.handleContextMenu(event as any)
    }

    if (this.canTargetOpenInspector(target)) {
      this.props.openFlowNodeProps()
    }

    if (selectedNode && (!currentNode || selectedNode.id !== currentNode.id)) {
      // Different node selected
      this.props.switchFlowNode(selectedNode.id)
    }

    if (selectedNode && (selectedNode.oldX !== selectedNode.x || selectedNode.oldY !== selectedNode.y)) {
      this.props.updateFlowNode({ x: selectedNode.x, y: selectedNode.y })
      Object.assign(selectedNode, { oldX: selectedNode.x, oldY: selectedNode.y })
    }

    this.checkForLinksUpdate()
  }

  checkForLinksUpdate = _.debounce(
    () => {
      if (this.props.readOnly) {
        return
      }

      const links = this.manager.getLinksRequiringUpdate()
      if (links) {
        this.props.updateFlow({ links })
      }

      this.checkForProblems()
    },
    500,
    { leading: true }
  )

  deleteSelectedElements() {
    const elements = _.sortBy(this.diagramEngine.getDiagramModel().getSelectedItems(), 'nodeType')

    // Use sorting to make the nodes first in the array, deleting the node before the links
    for (const element of elements) {
      if (!this.diagramEngine.isModelLocked(element)) {
        if (element['isStartNode']) {
          return alert(lang.tr('studio.flow.cantDeleteStart'))
        } else if (element.type === 'success') {
          return alert(lang.tr('studio.flow.cantDeleteSuccess'))
        } else if (element.type === 'failure') {
          return alert(lang.tr('studio.flow.cantDeleteFailure'))
        } else if (_.includes(nodeTypes, element['nodeType']) || _.includes(nodeTypes, element.type)) {
          this.props.removeFlowNode(element)
        } else if (element.type === 'default') {
          element.remove()
          this.checkForLinksUpdate()
        } else {
          element.remove() // it's a point or something else
        }
      }
    }

    this.props.closeFlowNodeProps()
    this.diagramWidget.forceUpdate()
    this.checkForProblems()
  }

  copySelectedElementToBuffer() {
    this.props.copyFlowNode()
    Toaster.create({
      className: 'recipe-toaster',
      position: Position.TOP_RIGHT
    }).show({ message: lang.tr('studio.flow.copiedToBuffer') })
  }

  pasteElementFromBuffer(position?) {
    if (position) {
      this.props.pasteFlowNode(position)
    } else {
      const { offsetX, offsetY } = this.manager.getActiveModelOffset()
      this.props.pasteFlowNode({ x: -offsetX + DIAGRAM_PADDING, y: -offsetY + DIAGRAM_PADDING })
    }

    this.manager.unselectAllElements()
  }

  editTriggers(node) {
    this.setState({ currentTriggerNode: node, isTriggerEditOpen: true })
  }

  onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      this.copySelectedElementToBuffer()
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      this.pasteElementFromBuffer()
    }
  }

  handleFlowWideClicked = () => {
    this.props.switchFlowNode(null)
    this.props.openFlowNodeProps()
  }

  handleToolDropped = async (event: React.DragEvent) => {
    if (this.props.readOnly) {
      return
    }

    this.manager.unselectAllElements()
    const data = JSON.parse(event.dataTransfer.getData('diagram-node'))

    const point = this.manager.getRealPosition(event)

    if (data.type === 'skill') {
      this.add.skillNode(point, data.id)
    } else if (data.type === 'node') {
      switch (data.id) {
        case 'say_something':
          this.add.sayNode(point)
          break
        case 'execute':
          this.add.executeNode(point)
          break
        case 'listen':
          this.add.listenNode(point)
          break
        case 'router':
          this.add.routerNode(point)
          break
        case 'action':
          this.add.actionNode(point)
          break
        case 'trigger':
          this.add.triggerNode(point)
          break
        default:
          this.add.flowNode(point)
          break
      }
    }
  }

  render() {
    const canAdd = !this.props.defaultLang || this.props.defaultLang === this.props.currentLang

    return (
      <MainLayout.Wrapper>
        <WorkflowToolbar
          highlightFilter={this.props.highlightFilter}
          handleFilterChanged={value => this.props.handleFilterChanged({ target: { value } })}
        />
        <div
          id="diagramContainer"
          ref={ref => (this.diagramContainer = ref)}
          tabIndex={1}
          style={{ outline: 'none', width: '100%', height: '100%' }}
          onContextMenu={this.handleContextMenu}
          onDrop={this.handleToolDropped}
          onDragOver={event => event.preventDefault()}
        >
          <div className={style.floatingInfo}>
            <DiagramToolbar
              currentFlow={this.props.currentFlow}
              handleFlowWideClicked={this.handleFlowWideClicked}
              mutexInfo={this.props.mutexInfo}
              highlightNode={node => {
                this.manager.setHighlightedNodes([node])
                this.forceUpdate()
              }}
            />
          </div>

          <DiagramWidget
            ref={w => (this.diagramWidget = w)}
            deleteKeys={[]}
            diagramEngine={this.diagramEngine}
            maxNumberPointsPerLink={MAX_NUMBER_OF_POINTS_PER_LINK}
            inverseZoom
          />
          <ZoomToolbar />
          {canAdd && <NodeToolbar />}
          <TriggerEditor
            node={this.state.currentTriggerNode}
            isOpen={this.state.isTriggerEditOpen}
            diagramEngine={this.diagramEngine}
            toggle={() => this.setState({ isTriggerEditOpen: !this.state.isTriggerEditOpen })}
          />
        </div>
      </MainLayout.Wrapper>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  flows: getAllFlows(state.flows),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  canPasteNode: Boolean(state.flows.nodeInBuffer),
  emulatorOpen: state.ui.emulatorOpen,
  debuggerEvent: state.flows.debuggerEvent,
  zoomLevel: state.ui.zoomLevel,
  conditions: state.ndu.conditions,
  skills: state.skills.installed
})

const mapDispatchToProps = {
  fetchFlows,
  switchFlowNode,
  openFlowNodeProps,
  closeFlowNodeProps,
  setDiagramAction,
  createFlowNode,
  removeFlowNode,
  createFlow,
  updateFlowNode,
  switchFlow,
  updateFlow,
  copyFlowNode,
  pasteFlowNode,
  refreshFlowsLinks,
  insertNewSkillNode,
  updateFlowProblems,
  zoomToLevel,
  buildSkill: buildNewSkill
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(Diagram)
