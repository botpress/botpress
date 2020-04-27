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
import { lang } from 'botpress/shared'
import { FlowView, LibraryElement } from 'common/typings'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import { DefaultPortModel, DiagramEngine, DiagramWidget, NodeModel, PointModel } from 'storm-react-diagrams'
import {
  addElementToLibrary,
  buildNewSkill,
  closeFlowNodeProps,
  copyFlowNode,
  createFlow,
  createFlowNode,
  fetchFlows,
  insertNewSkillNode,
  openFlowNodeProps,
  pasteFlowNode,
  removeFlowNode,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems
} from '~/actions'
import { toastSuccess } from '~/components/Shared/Utils'
import { getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'
import {
  defaultTransition,
  DIAGRAM_PADDING,
  DiagramManager,
  nodeTypes,
  Point
} from '~/views/FlowBuilder/diagram/manager'
import { DeletableLinkFactory } from '~/views/FlowBuilder/diagram/nodes/LinkWidget'
import { SkillCallNodeModel, SkillCallWidgetFactory } from '~/views/FlowBuilder/diagram/nodes/SkillCallNode'
import { StandardNodeModel, StandardWidgetFactory } from '~/views/FlowBuilder/diagram/nodes/StandardNode'
import { textToItemId } from '~/views/FlowBuilder/diagram/nodes_v2/utils'
import { ActionWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/ActionNode'
import { ExecuteNodeModel, ExecuteWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/ExecuteNode'
import { FailureNodeModel, FailureWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/FailureNode'
import { ListenWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/ListenNode'
import { RouterNodeModel, RouterWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/RouterNode'
import { SaySomethingNodeModel, SaySomethingWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/SaySomethingNode'
import { SuccessNodeModel, SuccessWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/SuccessNode'
import { TriggerNodeModel, TriggerWidgetFactory } from '~/views/FlowBuilder/diagram/nodes_v2/TriggerNode'
import style from '~/views/FlowBuilder/diagram/style.scss'

import TriggerEditor from './TriggerEditor'

interface OwnProps {
  showSearch: boolean
  hideSearch: () => void
  readOnly: boolean
  canPasteNode: boolean
  flowPreview: boolean
  highlightFilter: string
  handleFilterChanged: (event: any) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

type BpNodeModel = StandardNodeModel | SkillCallNodeModel

type ExtendedDiagramEngine = {
  enableLinkPoints?: boolean
  flowBuilder?: any
} & DiagramEngine

class Diagram extends Component<Props> {
  private diagramEngine: ExtendedDiagramEngine
  private diagramWidget: DiagramWidget
  private diagramContainer: HTMLDivElement
  private manager: DiagramManager
  /** Represents the source port clicked when the user is connecting a node */
  private dragPortSource: any

  state = {
    highlightFilter: '',
    currentTriggerNode: null,
    isTriggerEditOpen: false
  }

  constructor(props) {
    super(props)

    this.diagramEngine = new DiagramEngine()
    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())
    this.diagramEngine.registerNodeFactory(new SkillCallWidgetFactory(this.props.skills))
    this.diagramEngine.registerNodeFactory(new SaySomethingWidgetFactory())
    this.diagramEngine.registerNodeFactory(new ExecuteWidgetFactory())
    this.diagramEngine.registerNodeFactory(new ListenWidgetFactory())
    this.diagramEngine.registerNodeFactory(new RouterWidgetFactory())
    this.diagramEngine.registerNodeFactory(new ActionWidgetFactory())
    this.diagramEngine.registerNodeFactory(new SuccessWidgetFactory())
    this.diagramEngine.registerNodeFactory(new TriggerWidgetFactory())
    this.diagramEngine.registerNodeFactory(new FailureWidgetFactory())
    this.diagramEngine.registerLinkFactory(new DeletableLinkFactory())

    // This reference allows us to update flow nodes from widgets
    this.diagramEngine.flowBuilder = this
    this.manager = new DiagramManager(this.diagramEngine, { switchFlowNode: this.props.switchFlowNode })

    if (this.props.highlightFilter) {
      this.manager.setHighlightedNodes(this.props.highlightFilter)
    }

    // @ts-ignore
    window.highlightNode = (flowName: string, nodeName: string) => {
      this.manager.setHighlightedNodes(nodeName)

      if (!flowName || !nodeName) {
        // Refreshing the model anyway, to remove the highlight if node is undefined
        this.manager.syncModel()
        return
      }

      try {
        if (this.props.currentFlow.name !== flowName) {
          this.props.switchFlow(flowName)
        } else {
          this.manager.syncModel()
        }
      } catch (err) {
        console.error('Error when switching flow or refreshing', err)
      }
    }
  }

  componentDidMount() {
    this.props.fetchFlows()
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
      // tslint:disable-next-line: no-floating-promises
      this.linkCreatedNode()
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
    if (this.props.highlightFilter && this.props.showSearch) {
      this.manager.setHighlightedNodes(this.props.highlightFilter)
      this.manager.syncModel()
    }

    // Refresh nodes when the filter is updated
    if (this.props.highlightFilter !== prevProps.highlightFilter) {
      this.manager.setHighlightedNodes(this.props.highlightFilter)
      this.manager.syncModel()
    }

    // Clear nodes when search field is hidden
    if (!this.props.showSearch && prevProps.showSearch) {
      this.manager.setHighlightedNodes([])
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
    flowNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'standard' }),
    skillNode: (point: Point, skillId: string) => this.props.buildSkill({ location: point, id: skillId }),
    triggerNode: (point: Point, moreProps) => {
      this.props.createFlowNode({ ...point, type: 'trigger', conditions: [], next: [defaultTransition], ...moreProps })
    },
    sayNode: (point: Point, moreProps) => {
      this.props.createFlowNode({ ...point, type: 'say_something', next: [defaultTransition], ...moreProps })
    },
    executeNode: (point: Point, moreProps) =>
      this.props.createFlowNode({ ...point, type: 'execute', next: [defaultTransition], ...moreProps }),
    listenNode: (point: Point) =>
      this.props.createFlowNode({
        ...point,
        type: 'listen',
        onReceive: [],
        next: [defaultTransition],
        triggers: [{ conditions: [{ id: 'always' }] }]
      }),
    routerNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'router' }),
    actionNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'action' })
  }

  onDiagramDoubleClick = (event?: MouseEvent) => {
    if (!event) {
      return
    }

    const target = this.diagramWidget.getMouseElement(event)

    if (target?.model instanceof TriggerNodeModel) {
      this.editTriggers(target.model)
    }
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

    ContextMenu.show(
      <Menu>
        {this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        <MenuDivider title={lang.tr('studio.flow.addNode')} />
        {!originatesFromOutPort && (
          <MenuItem
            text={lang.tr('studio.flow.nodeType.trigger')}
            onClick={wrap(this.add.triggerNode, point)}
            icon="send-to-graph"
          />
        )}
        <MenuItem
          text={lang.tr('studio.flow.nodeType.sendMessage')}
          onClick={wrap(this.add.sayNode, point)}
          icon="comment"
        />
        <MenuItem
          text={lang.tr('studio.flow.nodeType.executeAction')}
          onClick={wrap(this.add.executeNode, point)}
          icon="code-block"
        />
        <MenuItem text={lang.tr('listen')} onClick={wrap(this.add.listenNode, point)} icon="hand" />
        <MenuItem text={lang.tr('split')} onClick={wrap(this.add.routerNode, point)} icon="flow-branch" />
        <MenuItem text={lang.tr('action')} onClick={wrap(this.add.actionNode, point)} icon="offline" />

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
      { left: event.clientX, top: event.clientY },
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

    const targetModel = target && target.model
    const point = this.manager.getRealPosition(event)

    const isNodeTargeted = targetModel instanceof NodeModel
    const isTriggerNode = targetModel instanceof TriggerNodeModel
    const isLibraryNode = targetModel instanceof SaySomethingNodeModel || targetModel instanceof ExecuteNodeModel

    const isSuccessNode = targetModel instanceof SuccessNodeModel
    const isFailureNode = targetModel instanceof FailureNodeModel
    const canDeleteNode = !(isSuccessNode || isFailureNode)

    // Prevents displaying an empty menu
    if ((!isNodeTargeted && !this.props.canPasteNode) || this.props.readOnly) {
      return
    }

    const canAddChipToTarget = this._canAddTransitionChipToTarget(target)

    const addTransitionNode = async () => {
      await this._addTransitionChipToRouter(target)
    }

    ContextMenu.show(
      <Menu>
        {!isNodeTargeted && this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        {isNodeTargeted && (
          <Fragment>
            {isTriggerNode && (
              <MenuItem icon="edit" text={lang.tr('edit')} onClick={() => this.editTriggers(targetModel)} />
            )}
            <MenuItem
              icon="trash"
              text={lang.tr('delete')}
              disabled={!canDeleteNode}
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
            {isLibraryNode && (
              <MenuItem
                icon="book"
                text={lang.tr('studio.flow.addToLibrary')}
                onClick={() => {
                  const elementId = textToItemId((targetModel as SaySomethingNodeModel).onEnter?.[0])
                  this.props.addElementToLibrary(elementId)
                  toastSuccess(`Added to library`)
                }}
              />
            )}
            {this.props.flowPreview && canAddChipToTarget ? (
              <React.Fragment>
                <MenuDivider />
                <MenuItem text={lang.tr('studio.flow.chips')}>
                  <MenuItem text={lang.tr('studio.flow.transition')} onClick={addTransitionNode} icon="flow-end" />
                </MenuItem>
              </React.Fragment>
            ) : null}
          </Fragment>
        )}
      </Menu>,
      { left: event.clientX, top: event.clientY }
    )
  }

  checkForProblems = _.debounce(() => {
    this.props.updateFlowProblems(this.manager.getNodeProblems())
  }, 500)

  createFlow(name: string) {
    this.props.createFlow(name + '.flow.json')
  }

  canTargetOpenInspector = target => {
    if (!target) {
      return false
    }

    const targetModel = target.model
    return (
      targetModel instanceof StandardNodeModel ||
      targetModel instanceof SkillCallNodeModel ||
      targetModel instanceof RouterNodeModel
    )
  }

  onDiagramClick = (event: MouseEvent) => {
    const selectedNode = this.manager.getSelectedNode() as BpNodeModel
    const currentNode = this.props.currentFlowNode
    const target = this.diagramWidget.getMouseElement(event)

    this.manager.sanitizeLinks()
    this.manager.cleanPortLinks()

    if (selectedNode && selectedNode instanceof PointModel) {
      this.dragPortSource = selectedNode
      this.handleContextMenu(event as any)
    }

    this.canTargetOpenInspector(target) ? this.props.openFlowNodeProps() : this.props.closeFlowNodeProps()

    if (!selectedNode) {
      this.props.closeFlowNodeProps()
      this.props.switchFlowNode(null)
    } else if (selectedNode && (!currentNode || selectedNode.id !== currentNode.id)) {
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

  editTriggers(node) {
    this.setState({
      currentTriggerNode: node,
      isTriggerEditOpen: true
    })
  }

  deleteSelectedElements() {
    const elements = _.sortBy(this.diagramEngine.getDiagramModel().getSelectedItems(), 'nodeType')

    // Use sorting to make the nodes first in the array, deleting the node before the links
    for (const element of elements) {
      if (!this.diagramEngine.isModelLocked(element)) {
        if (element.type === 'success') {
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

  handleFilterChanged = event => {
    this.setState({ highlightFilter: event.target.value })
  }

  renderCatchAllInfo() {
    const nbNext = _.get(this.props.currentFlow, 'catchAll.next.length', 0)
    const nbReceive = _.get(this.props.currentFlow, 'catchAll.onReceive.length', 0)

    return (
      <div style={{ display: 'flex', marginTop: 5 }}>
        <Button onClick={this.handleFlowWideClicked} minimal={true}>
          <Tag intent={nbNext > 0 ? Intent.PRIMARY : Intent.NONE}>{nbNext}</Tag>
          {lang.tr('studio.flow.flowWideTransitions', { count: nbNext })}
        </Button>
        <Button onClick={this.handleFlowWideClicked} minimal={true}>
          <Tag intent={nbReceive > 0 ? Intent.PRIMARY : Intent.NONE}>{nbReceive}</Tag>
          {lang.tr('studio.flow.flowWideOnReceives', { count: nbReceive })}
        </Button>
        {this.props.showSearch && (
          <ControlGroup>
            <InputGroup
              id="input-highlight-name"
              tabIndex={1}
              placeholder={lang.tr('studio.flow.highlightByName')}
              value={this.props.highlightFilter}
              onChange={this.props.handleFilterChanged}
              autoFocus={true}
            />
            <Button icon="small-cross" onClick={this.props.hideSearch} />
          </ControlGroup>
        )}
      </div>
    )
  }

  handleToolDropped = async (event: React.DragEvent) => {
    if (this.props.readOnly) {
      return
    }

    this.manager.unselectAllElements()
    const data = JSON.parse(event.dataTransfer.getData('diagram-node'))

    const point = this.manager.getRealPosition(event)

    if (data.type === 'chip') {
      const target = this.diagramWidget.getMouseElement(event)
      if (this._canAddTransitionChipToTarget(target)) {
        await this._addTransitionChipToRouter(target)
      }
    } else if (data.type === 'skill') {
      this.add.skillNode(point, data.id)
    } else if (data.type === 'node') {
      switch (data.id) {
        case 'say_something':
          const contentId = data.contentId?.startsWith('#!') ? data.contentId : `#!${data.contentId}`
          this.add.sayNode(point, contentId ? { onEnter: [`say ${contentId}`] } : {})
          break
        case 'execute':
          this.add.executeNode(point, data.contentId ? { onReceive: [`${data.contentId}`] } : {})
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
        default:
          this.add.flowNode(point)
          break
      }
    }
  }

  private async _addTransitionChipToRouter(target) {
    await this.props.switchFlowNode(target.model.id)
    this.props.updateFlowNode({ next: [...this.props.currentFlowNode.next, defaultTransition] })
  }

  private _canAddTransitionChipToTarget(target): boolean {
    if (this.props.readOnly) {
      return false
    }

    return target && target.model instanceof RouterNodeModel
  }

  render() {
    return (
      <Fragment>
        <div
          id="diagramContainer"
          ref={ref => (this.diagramContainer = ref)}
          tabIndex={1}
          style={{ outline: 'none', width: '100%', height: '100%' }}
          onContextMenu={this.handleContextMenu}
          onDrop={this.handleToolDropped}
          onDragOver={event => event.preventDefault()}
        >
          <div className={style.floatingInfo}>{this.renderCatchAllInfo()}</div>

          <DiagramWidget
            ref={w => (this.diagramWidget = w)}
            deleteKeys={[]}
            diagramEngine={this.diagramEngine}
            inverseZoom={true}
          />
        </div>

        <TriggerEditor
          node={this.state.currentTriggerNode}
          isOpen={this.state.isTriggerEditOpen}
          diagramEngine={this.diagramEngine}
          toggle={() => this.setState({ isTriggerEditOpen: !this.state.isTriggerEditOpen })}
        />
      </Fragment>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
  currentDiagramAction: state.flows.currentDiagramAction,
  canPasteNode: Boolean(state.flows.nodeInBuffer),
  skills: state.skills.installed,
  library: state.content.library
})

const mapDispatchToProps = {
  fetchFlows,
  switchFlowNode,
  openFlowNodeProps,
  closeFlowNodeProps,
  createFlowNode,
  removeFlowNode,
  createFlow,
  updateFlowNode,
  switchFlow,
  updateFlow,
  copyFlowNode,
  pasteFlowNode,
  insertNewSkillNode,
  updateFlowProblems,
  buildSkill: buildNewSkill,
  addElementToLibrary
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps, null, {
  withRef: true
})(Diagram)
