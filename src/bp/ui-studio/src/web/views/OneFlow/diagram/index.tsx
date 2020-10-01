import {
  Button,
  ContextMenu,
  ControlGroup,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  Position,
  Tag,
  Toaster
} from '@blueprintjs/core'
import { FlowVariable, IO } from 'botpress/sdk'
import { Contents, contextMenu, EmptyState, Icons, lang, MainContent, sharedStyle, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import * as portals from 'react-reverse-portal'
import { DefaultPortModel, DiagramEngine, DiagramWidget, NodeModel, PointModel } from 'storm-react-diagrams'
import {
  addElementToLibrary,
  buildNewSkill,
  closeFlowNodeProps,
  copyFlowNode,
  createFlow,
  createFlowNode,
  fetchContentCategories,
  fetchFlows,
  fetchPrompts,
  fetchVariables,
  getQnaCountByTopic,
  insertNewSkillNode,
  openFlowNodeProps,
  pasteFlowNode,
  refreshCallerFlows,
  refreshEntities,
  refreshFlowsLinks,
  removeFlowNode,
  setActiveFormItem,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems,
  zoomToLevel
} from '~/actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { history } from '~/components/Routes'
import { SearchBar } from '~/components/Shared/Interface'
import {
  getAllFlows,
  getCallerFlowsOutcomeUsage,
  getCurrentFlow,
  getCurrentFlowNode,
  getPrompts,
  getReusableWorkflows,
  getVariables,
  RootReducer
} from '~/reducers'
import storage from '~/util/storage'
import {
  defaultTransition,
  DiagramManager,
  DIAGRAM_PADDING,
  nodeTypes,
  outcomeNodeTypes,
  Point
} from '~/views/FlowBuilder/diagram/manager'
import { DeletableLinkFactory } from '~/views/FlowBuilder/diagram/nodes/LinkWidget'
import { SkillCallNodeModel, SkillCallWidgetFactory } from '~/views/FlowBuilder/diagram/nodes/SkillCallNode'
import { StandardNodeModel, StandardWidgetFactory } from '~/views/FlowBuilder/diagram/nodes/StandardNode'
import { textToItemId } from '~/views/FlowBuilder/diagram/nodes_v2/utils'
import style from '~/views/FlowBuilder/diagram/style.scss'

import { prepareEventForDiagram } from './debugger'
import { BlockModel, BlockWidgetFactory } from './nodes/Block'
import menuStyle from './style.scss'
import EmptyStateIcon from './EmptyStateIcon'
import Forms from './Forms'
import Toolbar from './Toolbar'
import VariablesList from './VariablesList'
import WorkflowToolbar from './WorkflowToolbar'
import ZoomToolbar from './ZoomToolbar'

interface OwnProps {
  childRef: (el: any) => void
  readOnly: boolean
  canPasteNode: boolean
  selectedTopic: string
  selectedWorkflow: string
  flowPreview: boolean
  editorPortal: portals.HtmlPortalNode
  highlightFilter: string
  showSearch: boolean
  hideSearch: () => void
  currentLang: string
  setCurrentLang: (lang: string) => void
  languages: string[]
  defaultLang: string
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

const EXPANDED_NODES_KEY = `bp::${window.BOT_ID}::expandedNodes`
const DIAGRAM_TAB_KEY = `bp::${window.BOT_ID}::diagramTab`

const getExpandedNodes = () => {
  try {
    return JSON.parse(storage.get(EXPANDED_NODES_KEY) || '[]')
  } catch (error) {
    return []
  }
}

const autoOpenNodes = ['say_something', 'trigger', 'prompt', 'execute']

class Diagram extends Component<Props> {
  private diagramEngine: ExtendedDiagramEngine
  private diagramWidget: DiagramWidget
  private diagramContainer: HTMLDivElement
  private searchRef: React.RefObject<HTMLInputElement>
  private manager: DiagramManager
  private timeout
  /** Represents the source port clicked when the user is connecting a node */
  private dragPortSource: any

  state = {
    currentTab: storage.get(DIAGRAM_TAB_KEY) || 'workflow',
    expandedNodes: [],
    nodeInfos: []
  }

  constructor(props) {
    super(props)

    const commonProps = {
      editNodeItem: this.editNodeItem.bind(this),
      selectedNodeItem: () => this.getPropsProperty('activeFormItem'),
      deleteSelectedElements: this.deleteSelectedElements.bind(this),
      getCurrentFlow: () => this.getPropsProperty('currentFlow'),
      updateFlowNode: this.updateNodeAndRefresh.bind(this),
      switchFlowNode: this.switchFlowNode.bind(this),
      getLanguage: () => ({
        currentLang: this.getPropsProperty('currentLang'),
        defaultLang: this.getPropsProperty('defaultLang')
      }),
      getConditions: () => this.getPropsProperty('conditions'),
      addCondition: this.addCondition.bind(this),
      addMessage: this.addMessage.bind(this),
      getExpandedNodes: () => this.getStateProperty('expandedNodes'),
      setExpandedNodes: this.updateExpandedNodes.bind(this),
      getDebugInfo: this.getDebugInfo,
      getFlows: () => this.getPropsProperty('flows')
    }

    this.diagramEngine = new DiagramEngine()
    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())
    this.diagramEngine.registerNodeFactory(new SkillCallWidgetFactory(this.props.skills))
    this.diagramEngine.registerNodeFactory(new BlockWidgetFactory(commonProps))
    this.diagramEngine.registerLinkFactory(new DeletableLinkFactory())

    // This reference allows us to update flow nodes from widgets
    this.diagramEngine.flowBuilder = this
    this.manager = new DiagramManager(this.diagramEngine, {
      switchFlowNode: this.props.switchFlowNode,
      zoomToLevel: this.props.zoomToLevel
    })

    if (this.props.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
    }

    // @ts-ignore
    window.showEventOnDiagram = () => {
      return event => this.showEventOnDiagram(event)
    }

    this.searchRef = React.createRef()
  }

  getDebugInfo = (nodeName: string) => {
    return (this.state.nodeInfos ?? [])
      .filter(x => x.workflow === this.props.currentFlow?.name.replace('.flow.json', ''))
      .find(x => x?.node == nodeName)
  }

  showEventOnDiagram(event?: IO.IncomingEvent) {
    if (!event) {
      this.manager.setHighlightedNodes([])
      this.setState({ nodeInfos: [] })
      return
    }

    const { flows, conditions } = this.props
    const { nodeInfos, highlightedNodes, topQna } = prepareEventForDiagram(event, flows, conditions)

    this.manager.setHighlightedNodes(highlightedNodes)
    this.manager.highlightLinkedNodes()
    this.setState({ nodeInfos })

    if (topQna) {
      history.push(`/oneflow/${topQna.topicName}/qna?id=${topQna.faqId.replace('__qna__', '')}`)
    } else if (highlightedNodes.length) {
      const firstFlow = highlightedNodes[0].flow

      if (this.props.currentFlow?.name !== firstFlow) {
        this.props.switchFlow(firstFlow)
      }
    }
  }

  componentDidMount() {
    this.props.fetchFlows()
    this.props.fetchPrompts()
    this.props.fetchVariables()
    this.props.refreshEntities()
    this.props.fetchContentCategories()
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('click', this.onDiagramClick)
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('dblclick', this.onDiagramDoubleClick)
    document.getElementById('diagramContainer').addEventListener('keydown', this.onKeyDown)

    this.setState({
      expandedNodes: getExpandedNodes()
    })
    this.props.childRef({
      deleteSelectedElements: this.deleteSelectedElements.bind(this),
      createFlow: this.createFlow.bind(this)
    })

    if (this.props.defaultLang !== this.props.currentLang) {
      this.showNotDefaultWarning()
    }
    if (this.props.currentFlow?.type === 'reusable' && this.props.defaultLang === this.props.currentLang) {
      this.showEditSubWorkflowWarning()
    }
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('click', this.onDiagramClick)
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('dblclick', this.onDiagramDoubleClick)
    document.getElementById('diagramContainer').removeEventListener('keydown', this.onKeyDown)
  }

  componentDidUpdate(prevProps, prevState) {
    this.manager.setCurrentFlow(this.props.currentFlow)
    this.manager.setReadOnly(this.props.readOnly)

    if (!prevProps.showSearch && this.props.showSearch) {
      this.searchRef.current.focus()
    }

    if (
      !prevState.activeFormItem &&
      this.props.currentFlowNode?.isNew &&
      autoOpenNodes.includes(this.props.currentFlowNode?.type)
    ) {
      this.editNodeItem(this.props.currentFlowNode, 0)
    }
    if (prevProps.zoomLevel !== this.props.zoomLevel) {
      this.diagramEngine.diagramModel.setZoomLevel(this.props.zoomLevel)
    }

    if (this.props.currentLang !== prevProps.currentLang && this.props.defaultLang !== this.props.currentLang) {
      this.showNotDefaultWarning()
    } else if (this.props.defaultLang === this.props.currentLang) {
      toast.dismiss('notViewingDefaultLang')
    }
    if (
      (this.props.currentFlow?.type !== prevProps.currentFlow?.type ||
        this.props.currentLang !== prevProps.currentLang) &&
      this.props.currentFlow?.type === 'reusable' &&
      this.props.defaultLang === this.props.currentLang
    ) {
      this.showEditSubWorkflowWarning()
    } else if (this.props.currentFlow?.type !== 'reusable' || this.props.defaultLang !== this.props.currentLang) {
      toast.dismiss('editingSubWorkflowWarning')
    }

    if (this.diagramContainer) {
      const { offsetWidth, offsetHeight } = this.diagramContainer

      if (offsetHeight !== 0 && offsetWidth !== 0) {
        this.manager.setDiagramContainer(this.diagramWidget, { width: offsetWidth, height: offsetHeight })
      }
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
    if (this.props.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
      this.manager.syncModel()
    }

    // Refresh nodes when the filter is updated
    if (this.props.highlightFilter !== prevProps.highlightFilter) {
      this.manager.setHighlightFilter(this.props.highlightFilter)
      this.manager.syncModel()
    }

    // Clear nodes when search field is hidden
    if (!this.props.highlightFilter) {
      this.manager.setHighlightFilter()
      this.manager.syncModel()
    }
  }

  showNotDefaultWarning = () => {
    toast.warning(
      lang.tr('notViewingDefaultLang', {
        language: lang.tr(lang.tr(`isoLangs.${this.props.currentLang}.name`).toLowerCase())
      }),
      '',
      { timeout: 'infinite', hideDismiss: true, key: 'notViewingDefaultLang' }
    )
  }

  showEditSubWorkflowWarning = () => {
    toast.warning(lang.tr('studio.library.editingSubWorkflowWarning'), '', {
      timeout: 'infinite',
      hideDismiss: true,
      key: 'editingSubWorkflowWarning'
    })
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

  getTextFields = () => {
    const { fields, advancedSettings } =
      this.props.contentTypes.find(contentType => contentType.id === 'builtin_text')?.schema?.newJson || {}
    return [...(fields || []), ...(advancedSettings || [])]
  }

  add = {
    flowNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'standard' }),
    skillNode: (point: Point, skillId: string) => this.props.buildSkill({ location: point, id: skillId }),
    triggerNode: (point: Point, moreProps) => {
      this.props.createFlowNode({
        ...point,
        type: 'trigger',
        conditions: [{ params: {} }],
        next: [defaultTransition],
        isNew: true,
        ...moreProps
      })
    },
    say: (point: Point, moreProps) => {
      this.props.createFlowNode({
        ...point,
        type: 'say_something',
        contents: [
          {
            contentType: 'builtin_text',
            ...Contents.createEmptyDataFromSchema(this.getTextFields(), this.props.currentLang)
          }
        ],
        next: [defaultTransition],
        isNew: true,
        ...moreProps
      })
    },
    executeNode: (point: Point, moreProps) =>
      this.props.createFlowNode({ ...point, type: 'execute', next: [defaultTransition], ...moreProps, isNew: true }),
    routerNode: (point: Point) =>
      this.props.createFlowNode({
        ...point,
        type: 'router',
        next: [
          { condition: '', node: '' },
          { condition: 'true', node: '' }
        ]
      }),
    actionNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'action' }),
    promptNode: (point: Point, promptType: string, subType?: string) => {
      this.props.createFlowNode({
        ...point,
        type: 'prompt',
        isNew: true,
        prompt: {
          type: promptType,
          params: {
            output: '',
            question: {},
            subType
          }
        },
        next: [
          {
            caption: 'studio.prompt.userAnswersCorrectly',
            condition: 'thisNode.extracted === true',
            node: ''
          },
          {
            caption: 'studio.prompt.userDoesNotAnswer',
            condition: 'thisNode.timeout === true',
            node: ''
          },
          {
            caption: 'studio.prompt.userCancels',
            condition: 'thisNode.cancelled === true',
            node: ''
          }
        ]
      })
    },
    successNode: (point: Point) => {
      this.props.createFlowNode({ ...point, type: 'success' })
      this.props.refreshCallerFlows()
    },
    failureNode: (point: Point) => {
      this.props.createFlowNode({ ...point, type: 'failure' })
      this.props.refreshCallerFlows()
    },
    gotoSubWorkflow: (point: Point, flowName: string) => {
      this.props.createFlowNode({ ...point, type: 'sub-workflow', flow: flowName })
      this.props.refreshCallerFlows(flowName)
      this.props.updateFlowNode({ isNew: false })
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

    const hasSubFlows = !!this.props.reusableFlows?.length

    contextMenu(
      event,
      <Menu>
        {this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        <MenuDivider title={lang.tr('studio.flow.addNode')} />
        {!originatesFromOutPort && (
          <MenuItem text={lang.tr('trigger')} onClick={wrap(this.add.triggerNode, point)} icon="send-to-graph" />
        )}
        <MenuItem
          className={menuStyle.sayNodeContextMenu}
          text={lang.tr('say')}
          onClick={wrap(this.add.say, point)}
          icon={<Icons.Say />}
        />
        <MenuItem tagName="span" text={lang.tr('prompt')} icon="citation">
          {this.props.prompts.display.map(({ type, subType, label, icon }) => (
            <MenuItem
              key={`${type}-${subType}`}
              text={lang.tr(label)}
              tagName="button"
              onClick={wrap(this.add.promptNode, point, type, subType)}
              icon={icon as any}
            />
          ))}
        </MenuItem>
        <MenuItem text={lang.tr('execute')} onClick={wrap(this.add.executeNode, point)} icon="code" />
        <MenuItem text={lang.tr('ifElse')} onClick={wrap(this.add.routerNode, point)} icon="fork" />
        <MenuItem text={lang.tr('action')} onClick={wrap(this.add.actionNode, point)} icon="offline" />

        {this.props.currentFlow?.type === 'reusable' && (
          <MenuItem text="Outcome" icon="take-action">
            <MenuItem text="Success" onClick={wrap(this.add.successNode, point)} icon="tick" />
            <MenuItem text="Failure" onClick={wrap(this.add.failureNode, point)} icon="cross" />
          </MenuItem>
        )}

        <MenuItem text="Go to Reusable Workflow" icon="pivot" disabled={!hasSubFlows}>
          {this.props.reusableFlows?.map(flow => (
            <MenuItem text={flow.workflow} onClick={wrap(this.add.gotoSubWorkflow, point, flow.workflowPath)} />
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

    if (this.props.defaultLang && this.props.defaultLang !== this.props.currentLang) {
      toast.info('studio.flow.cannotAddContent')
      return
    }

    const target = this.diagramWidget.getMouseElement(event)
    if (!target && !this.props.readOnly) {
      this.handleContextMenuNoElement(event)
      return
    }

    const targetModel = target && target.model
    const { nodeType } = targetModel as BlockModel
    const point = this.manager.getRealPosition(event)

    const isNodeTargeted = targetModel instanceof NodeModel
    const isLibraryNode = nodeType === 'say_something' || nodeType === 'execute'

    // Prevents displaying an empty menu
    if ((!isNodeTargeted && !this.props.canPasteNode) || this.props.readOnly) {
      return
    }

    const canAddChipToTarget = this._canAddTransitionChipToTarget(target)

    const addTransitionNode = async () => {
      await this._addTransitionChipToRouter(target)
    }

    contextMenu(
      event,
      <Menu>
        {!isNodeTargeted && this.props.canPasteNode && (
          <MenuItem icon="clipboard" text={lang.tr('paste')} onClick={() => this.pasteElementFromBuffer(point)} />
        )}
        {isNodeTargeted && (
          <Fragment>
            <MenuItem icon="trash" text={lang.tr('delete')} onClick={() => this.deleteSelectedElements()} />
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
                  const elementId = textToItemId((targetModel as BlockModel).onEnter?.[0])
                  this.props.addElementToLibrary(elementId)
                  toast.success('Added to library')
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

    const targetModel = target.model
    const { nodeType } = targetModel

    return targetModel instanceof StandardNodeModel || targetModel instanceof SkillCallNodeModel
  }

  onDiagramDoubleClick = (event: MouseEvent) => {
    const target = this.diagramWidget.getMouseElement(event)
    const model = target?.model as BlockModel

    if (model.nodeType === 'sub-workflow') {
      this.props.switchFlow(model.flow)
    }
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

    if ((target?.model as BlockModel)?.nodeType === 'prompt') {
      this.editNodeItem(selectedNode, 0)
    }
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

  editNodeItem(node, index) {
    clearTimeout(this.timeout)
    if (node.isNew) {
      this.updateExpandedNodes(node.id, true)
      this.props.updateFlowNode({ isNew: false })
    }

    this.props.setActiveFormItem({ node, index })
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

  getStateProperty(propertyName) {
    return this.state[propertyName]
  }

  getPropsProperty(propertyName) {
    return this.props[propertyName]
  }

  addCondition(nodeType) {
    if (nodeType === 'trigger') {
      this.props.updateFlowNode({ conditions: [...this.props.currentFlowNode.conditions, { params: {} }] })
    } else if (nodeType === 'router') {
      const next = this.props.currentFlowNode.next
      const lastItem = next.length - 1

      // Inserting before the last element to keep "otherwise" at the end
      this.props.updateFlowNode({
        next: [...next.slice(0, lastItem), { condition: '', node: '' }, ...next.slice(lastItem)]
      })
    }
  }

  addMessage() {
    const schema = Contents.createEmptyDataFromSchema(this.getTextFields(), this.props.currentLang)
    this.props.updateFlowNode({
      contents: [...this.props.currentFlowNode.contents, { contentType: 'builtin_text', ...schema }]
    })
  }

  switchFlowNode(nodeId) {
    this.props.switchFlowNode(nodeId)
  }

  canDeleteOutcome(type: string, nodeName?: string, toastReason?: boolean) {
    const successCount = this.props.currentFlow.nodes.filter(x => x.type === 'success').length
    const failureCount = this.props.currentFlow.nodes.filter(x => x.type === 'failure').length
    const isUsed =
      nodeName === undefined ? false : !!this.props.outcomeUsage?.find(x => x.condition === `lastNode=${nodeName}`)

    if (isUsed) {
      toastReason && toast.failure(lang.tr('studio.flow.cantDeleteOutcome'))
      return false
    }

    if ((type === 'success' && successCount === 1) || (type === 'failure' && failureCount === 1)) {
      toastReason && toast.failure(lang.tr('studio.flow.mustHaveOutcomes'))
      return false
    }

    return true
  }

  deleteElement(element) {
    if (this.diagramEngine.isModelLocked(element)) {
      return
    }

    const type = element['nodeType']

    if (outcomeNodeTypes.includes(type)) {
      if (this.canDeleteOutcome(type, element['name'], true)) {
        this.props.removeFlowNode(element)
        this.props.refreshCallerFlows()
      }
    } else if (this.props.currentFlow.type === 'reusable' && this.props.currentFlow.startNode === element['name']) {
      toast.failure(lang.tr('studio.flow.cantDeleteStartReusable'))
    } else if (_.includes(nodeTypes, type) || _.includes(nodeTypes, element.type)) {
      this.props.removeFlowNode(element)
    } else if (element.type === 'default') {
      element.remove()
      this.checkForLinksUpdate()
    } else {
      element.remove() // it's a point or something else
    }
  }

  deleteSelectedElements() {
    const elements = _.sortBy(this.diagramEngine.getDiagramModel().getSelectedItems(), 'nodeType')
    this.props.setActiveFormItem(null)

    // Use sorting to make the nodes first in the array, deleting the node before the links
    for (const element of elements) {
      this.deleteElement(element)
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
    const target = this.diagramWidget.getMouseElement(event)
    const targetNodeType = target?.model['nodeType']

    if (data.type === 'chip') {
      const target = this.diagramWidget.getMouseElement(event)
      if (this._canAddTransitionChipToTarget(target)) {
        await this._addTransitionChipToRouter(target)
      }
    } else if (data.type === 'skill') {
      this.add.skillNode(point, data.id)
    } else if (data.type === 'subworkflow') {
      if (this.props.currentFlow.name !== data.id) {
        this.add.gotoSubWorkflow(point, data.id)
      }
    } else if (data.type === 'node') {
      switch (data.id) {
        case 'trigger':
          if (targetNodeType === 'trigger') {
            await this.props.switchFlowNode(target.model.id)
            this.addCondition(targetNodeType)
          } else {
            this.add.triggerNode(point, {})
          }

          break
        case 'prompt':
          this.add.promptNode(point, '')
          break
        case 'say_something':
          if (targetNodeType === 'say_something') {
            await this.props.switchFlowNode(target.model.id)
            this.addMessage()
          } else {
            this.add.say(point, {})
          }

          break
        case 'execute':
          this.add.executeNode(point, data.contentId ? { onReceive: [`${data.contentId}`] } : {})
          break
        case 'router':
          if (targetNodeType === 'router') {
            await this.props.switchFlowNode(target.model.id)
            this.addCondition(targetNodeType)
          } else {
            this.add.routerNode(point)
          }
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

    return target?.model?.nodeType === 'router'
  }

  handleTabChanged = (tab: string) => {
    this.setState({ currentTab: tab })
    storage.set(DIAGRAM_TAB_KEY, tab)
  }

  addVariable = (variable?: FlowVariable & { isNew?: boolean }) => {
    const vars = this.props.variables.currentFlow ?? []

    if (!variable) {
      variable = {
        type: 'string',
        params: { name: `new-variable-${vars.length ?? 0}` },
        isNew: true
      }
    }

    this.props.updateFlow({ ...this.props.currentFlow, variables: [...vars, variable] })

    if (variable?.isNew) {
      this.editVariable(variable)
    }
  }

  editVariable = variable => {
    clearTimeout(this.timeout)
    const vars = this.props.currentFlow?.variables ?? []

    let index = vars.findIndex(x => x === variable)
    if (index === -1 && variable.isNew) {
      index = vars.length
    }

    this.props.setActiveFormItem({ node: { type: 'variable', variable }, index })
  }

  renderSearch = () => {
    return (
      this.props.showSearch && (
        <div className={style.floatingInfo}>
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
        </div>
      )
    )
  }

  render() {
    const isQnA = this.props.selectedWorkflow === 'qna'
    const { currentTab } = this.state
    const canAdd = !this.props.defaultLang || this.props.defaultLang === this.props.currentLang

    return (
      <Fragment>
        {isQnA && (
          <InjectedModuleView
            key={`${this.props.selectedTopic}`}
            moduleName="qna"
            componentName="LiteEditor"
            contentLang={this.props.currentLang}
            extraProps={{
              updateLocalLang: lang => this.props.setCurrentLang(lang),
              isLite: true,
              licensing: this.props.licensing,
              emulatorOpen: this.props.emulatorOpen,
              topicName: this.props.selectedTopic,
              languages: this.props.languages,
              defaultLang: this.props.defaultLang,
              events: this.props.hints || [],
              refreshQnaCount: () => {
                // So it's processed on the next tick, otherwise it won't update with the latest update
                setTimeout(() => {
                  this.props.getQnaCountByTopic()
                }, 100)
              }
            }}
          />
        )}
        <MainContent.Wrapper
          className={cx({
            [style.hidden]: isQnA || this.props.currentFlow === undefined,
            'emulator-open': this.props.emulatorOpen
          })}
        >
          <WorkflowToolbar
            currentLang={this.props.currentLang}
            languages={this.props.languages}
            currentTab={this.state.currentTab}
            setCurrentLang={lang => this.props.setCurrentLang(lang)}
            addVariable={this.addVariable}
            canAdd={canAdd}
            tabChange={this.handleTabChanged}
          />
          {currentTab === 'variables' ? (
            <VariablesList editVariable={this.editVariable} />
          ) : (
            <div className={style.searchWrapper}>
              <SearchBar
                className={sharedStyle.noPadding}
                ref={this.searchRef}
                onBlur={this.props.hideSearch}
                value={this.props.highlightFilter}
                placeholder={lang.tr('studio.flow.filterBlocks')}
                onChange={this.props.handleFilterChanged}
              />
            </div>
          )}
          <Fragment>
            <div
              id="diagramContainer"
              ref={ref => (this.diagramContainer = ref)}
              tabIndex={1}
              className={cx(style.diagramContainer, { [style.hidden]: currentTab !== 'workflow' })}
              onContextMenu={this.handleContextMenu}
              onDrop={this.handleToolDropped}
              onDragOver={event => event.preventDefault()}
            >
              <DiagramWidget
                ref={w => (this.diagramWidget = w)}
                deleteKeys={[]}
                diagramEngine={this.diagramEngine}
                maxNumberPointsPerLink={0}
                inverseZoom={true}
              />
              <ZoomToolbar />
            </div>
            {currentTab === 'workflow' && this.props.currentFlow?.nodes?.length === 0 && (
              <div className={style.centered}>
                <EmptyState
                  text={lang.tr('studio.flow.emptyWorkflow')}
                  icon={<EmptyStateIcon />}
                  className={style.emptyState}
                />
              </div>
            )}
            {currentTab === 'workflow' && canAdd && <Toolbar />}
          </Fragment>
        </MainContent.Wrapper>

        <Forms
          editorPortal={this.props.editorPortal}
          addVariable={this.addVariable}
          diagramEngine={this.diagramEngine}
          deleteSelectedElements={this.deleteSelectedElements.bind(this)}
          updateEditingNodeItem={activeFormItem => this.props.setActiveFormItem(activeFormItem)}
          updateTimeout={timeout => (this.timeout = timeout)}
          selectedTopic={this.props.selectedTopic}
          currentLang={this.props.currentLang}
          defaultLang={this.props.defaultLang}
        />
      </Fragment>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  flows: getAllFlows(state),
  reusableFlows: getReusableWorkflows(state),
  outcomeUsage: getCallerFlowsOutcomeUsage(state),
  currentFlowNode: getCurrentFlowNode(state),
  canPasteNode: Boolean(state.flows.nodeInBuffer),
  skills: state.skills.installed,
  library: state.content.library,
  prompts: getPrompts(state),
  variables: getVariables(state),
  contentTypes: state.content.categories,
  hints: state.hints.inputs,
  emulatorOpen: state.ui.emulatorOpen,
  activeFormItem: state.flows.activeFormItem,
  conditions: state.ndu.conditions,
  zoomLevel: state.ui.zoomLevel,
  licensing: state.core.licensing
})

const mapDispatchToProps = {
  fetchFlows,
  fetchPrompts,
  fetchVariables,
  refreshEntities,
  switchFlowNode,
  openFlowNodeProps,
  closeFlowNodeProps,
  createFlowNode,
  removeFlowNode,
  refreshCallerFlows,
  createFlow,
  updateFlowNode,
  switchFlow,
  updateFlow,
  copyFlowNode,
  pasteFlowNode,
  insertNewSkillNode,
  updateFlowProblems,
  buildSkill: buildNewSkill,
  addElementToLibrary,
  refreshFlowsLinks,
  fetchContentCategories,
  getQnaCountByTopic,
  setActiveFormItem,
  zoomToLevel
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps, null, {
  withRef: true
})(Diagram)
