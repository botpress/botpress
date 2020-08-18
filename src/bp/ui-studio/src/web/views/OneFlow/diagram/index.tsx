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
import { FlowVariable } from 'botpress/sdk'
import { Contents, contextMenu, Icons, lang, MainContent, toast } from 'botpress/shared'
import cx from 'classnames'
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
  refreshHints,
  removeFlowNode,
  setActiveFormItem,
  switchFlow,
  switchFlowNode,
  updateFlow,
  updateFlowNode,
  updateFlowProblems
} from '~/actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { toastSuccess } from '~/components/Shared/Utils'
import withLanguage from '~/components/Util/withLanguage'
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

import { BlockModel, BlockWidgetFactory } from './nodes/Block'
import menuStyle from './style.scss'
import ActionForm from './ActionForm'
import ConditionForm from './ConditionForm'
import ContentForm from './ContentForm'
import ExecuteForm from './ExecuteForm'
import PromptForm from './PromptForm'
import SubWorkflowForm from './SubWorkflowForm'
import Toolbar from './Toolbar'
import VariablesEditor from './VariablesEditor'
import VariableForm from './VariableForm'
import VariableTypesForm from './VariableTypesForm'
import WorkflowToolbar from './WorkflowToolbar'

interface OwnProps {
  childRef: (el: any) => void
  showSearch: boolean
  hideSearch: () => void
  readOnly: boolean
  canPasteNode: boolean
  selectedTopic: string
  selectedWorkflow: string
  flowPreview: boolean
  highlightFilter: string
  handleFilterChanged: (event: any) => void
}

interface LangProps {
  contentLang: string
  languages: string[]
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps & LangProps

type BpNodeModel = StandardNodeModel | SkillCallNodeModel

type ExtendedDiagramEngine = {
  enableLinkPoints?: boolean
  flowBuilder?: any
} & DiagramEngine

const EXPANDED_NODES_KEY = `bp::${window.BOT_ID}::expandedNodes`

const isContentEmpty = content => {
  return !_.flatMap(content).length
}

const getEmptyContent = content => {
  return {
    contentType: content[Object.keys(content)[0]]?.contentType
  }
}

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
  private manager: DiagramManager
  private timeout
  /** Represents the source port clicked when the user is connecting a node */
  private dragPortSource: any

  state = {
    highlightFilter: '',
    editingNodeItem: null,
    currentLang: '',
    currentTab: 'workflow',
    expandedNodes: []
  }

  constructor(props) {
    super(props)

    const commonProps = {
      editNodeItem: this.editNodeItem.bind(this),
      selectedNodeItem: () => this.getStateProperty('editingNodeItem'),
      deleteSelectedElements: this.deleteSelectedElements.bind(this),
      getCurrentFlow: () => this.getPropsProperty('currentFlow'),
      updateFlowNode: this.updateNodeAndRefresh.bind(this),
      switchFlowNode: this.switchFlowNode.bind(this),
      getCurrentLang: () => this.getStateProperty('currentLang'),
      getConditions: () => this.getPropsProperty('conditions'),
      addCondition: this.addCondition.bind(this),
      getExpandedNodes: () => this.getStateProperty('expandedNodes'),
      setExpandedNodes: this.updateExpandedNodes.bind(this)
    }

    this.diagramEngine = new DiagramEngine()
    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())
    this.diagramEngine.registerNodeFactory(new SkillCallWidgetFactory(this.props.skills))
    this.diagramEngine.registerNodeFactory(new BlockWidgetFactory(commonProps))
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
    this.props.fetchPrompts()
    this.props.fetchVariables()
    this.props.refreshEntities()
    this.props.fetchContentCategories()
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('click', this.onDiagramClick)
    document.getElementById('diagramContainer').addEventListener('keydown', this.onKeyDown)

    this.setState({ currentLang: this.props.contentLang, expandedNodes: getExpandedNodes() })
    this.props.childRef({
      deleteSelectedElements: this.deleteSelectedElements.bind(this),
      createFlow: this.createFlow.bind(this)
    })
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('click', this.onDiagramClick)
    document.getElementById('diagramContainer').removeEventListener('keydown', this.onKeyDown)
  }

  componentDidUpdate(prevProps, prevState) {
    this.manager.setCurrentFlow(this.props.currentFlow)
    this.manager.setReadOnly(this.props.readOnly)

    if (
      !prevState.editingNodeItem &&
      this.props.currentFlowNode?.isNew &&
      ['say_something', 'trigger', 'prompt'].includes(this.props.currentFlowNode?.type)
    ) {
      this.editNodeItem(this.props.currentFlowNode, 0)
    }

    if (this.props.activeFormItem !== undefined && prevProps.activeFormItem !== this.props.activeFormItem) {
      clearTimeout(this.timeout)
      this.setState({ editingNodeItem: this.props.activeFormItem })
    }

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
      const { fields, advancedSettings } =
        this.props.contentTypes.find(contentType => contentType.id === 'builtin_text')?.schema?.newJson || {}
      const schemaFields = [...(fields || []), ...(advancedSettings || [])]

      this.props.createFlowNode({
        ...point,
        type: 'say_something',
        contents: [
          { contentType: 'builtin_text', ...Contents.createEmptyDataFromSchema(schemaFields, this.state.currentLang) }
        ],
        next: [defaultTransition],
        isNew: true,
        ...moreProps
      })
    },
    executeNode: (point: Point, moreProps) =>
      this.props.createFlowNode({ ...point, type: 'execute', next: [defaultTransition], ...moreProps }),
    routerNode: (point: Point) => this.props.createFlowNode({ ...point, type: 'router' }),
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
            caption: lang.tr('studio.prompt.userAnswersCorrectly'),
            condition: 'thisNode.extracted === true',
            node: ''
          },
          {
            caption: lang.tr('studio.prompt.userDoesNotAnswer'),
            condition: 'thisNode.timeout === true',
            node: ''
          },
          {
            caption: lang.tr('studio.prompt.userCancels'),
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

        <MenuItem tagName="span" text={lang.tr('skills')} icon="add">
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

    ContextMenu.show(
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
                  toastSuccess('Added to library')
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
    this.props.createFlow(`${name}.flow.json`)
  }

  canTargetOpenInspector = target => {
    if (!target) {
      return false
    }

    const targetModel = target.model
    const { nodeType } = targetModel

    return (
      targetModel instanceof StandardNodeModel || targetModel instanceof SkillCallNodeModel || nodeType === 'router'
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

    this.setState({ editingNodeItem: { node, index } })
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

  addCondition(nodeId) {
    this.props.updateFlowNode({ conditions: [...this.props.currentFlowNode.conditions, { params: {} }] })
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
    this.setState({ editingNodeItem: null })

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

  handleFilterChanged = event => {
    this.setState({ highlightFilter: event.target.value })
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
        case 'trigger':
          this.add.triggerNode(point, {})
          break
        case 'prompt':
          this.add.promptNode(point, '')
          break
        case 'say_something':
          this.add.say(point, {})
          break
        case 'execute':
          this.add.executeNode(point, data.contentId ? { onReceive: [`${data.contentId}`] } : {})
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

    return target?.model?.nodeType === 'router'
  }

  updateNodeContent(data) {
    const { node, index } = this.state.editingNodeItem
    const newContents = [...node.contents]

    newContents[index] = data

    this.props.switchFlowNode(node.id)
    this.setState({ editingNodeItem: { node: { ...node, contents: newContents }, index } })

    this.props.updateFlowNode({ contents: newContents })
  }

  updateNodeCondition(data) {
    const { node, index } = this.state.editingNodeItem
    const newConditions = [...node.conditions]

    newConditions[index] = data

    this.props.switchFlowNode(node.id)
    this.setState({ editingNodeItem: { node: { ...node, conditions: newConditions }, index } })

    this.props.updateFlowNode({ conditions: newConditions })
  }

  updatePromptNode(args) {
    const { node } = this.state.editingNodeItem

    this.props.switchFlowNode(node.id)
    this.props.updateFlowNode({ prompt: { ...args } })
  }

  deleteNodeContent() {
    const {
      node: { contents },
      index
    } = this.state.editingNodeItem
    const newContents = [...contents]

    newContents[index] = Object.keys(newContents[index]).reduce((acc, lang) => {
      if (lang !== this.state.currentLang) {
        acc = { ...acc, [lang]: { ...newContents[index][lang] } }
      }

      return acc
    }, {})

    if (isContentEmpty(newContents[index])) {
      this.deleteSelectedElements()
    } else {
      this.props.updateFlowNode({ contents: newContents })
    }

    this.setState({ editingNodeItem: null })
  }

  deleteNodeCondition() {
    const {
      node: { conditions },
      index
    } = this.state.editingNodeItem
    const newConditions = conditions.filter((cond, i) => index !== i)

    if (!newConditions.length) {
      this.deleteSelectedElements()
    } else {
      this.props.updateFlowNode({ conditions: newConditions })
    }

    this.setState({ editingNodeItem: null })
  }

  handleTabChanged = (tab: string) => {
    this.setState({ currentTab: tab })
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
    const vars = this.props.currentFlow?.variables ?? []

    let index = vars.findIndex(x => x === variable)
    if (index === -1 && variable.isNew) {
      index = vars.length
    }

    this.setState({ editingNodeItem: { node: { type: 'variable', variable }, index } })
  }

  updateFlowVariable = data => {
    const { node, index } = this.state.editingNodeItem
    const vars = this.props.variables.currentFlow ?? []

    this.setState({ editingNodeItem: { node: { ...node, variable: data }, index } })

    this.props.updateFlow({
      ...this.props.currentFlow,
      variables: [...vars.slice(0, index), data, ...vars.slice(index + 1)]
    })
  }

  deleteVariable = () => {
    const { index } = this.state.editingNodeItem
    const vars = this.props.variables.currentFlow ?? []

    this.props.updateFlow({
      ...this.props.currentFlow,
      variables: [...vars.slice(0, index), ...vars.slice(index + 1)]
    })
  }

  updateSubWorkflow = data => {
    const { node, index } = this.state.editingNodeItem

    this.props.switchFlowNode(node.id)
    this.setState({ editingNodeItem: { node: { ...node, subflow: { ...node.subflow, ...data } }, index } })

    this.props.updateFlowNode({ subflow: data })
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
    const { node, index, data } = this.state.editingNodeItem || {}
    const formType: string = node?.nodeType || node?.type || this.state.editingNodeItem?.type

    let currentItem
    if (formType === 'say_something') {
      currentItem = node?.contents?.[index]
    } else if (formType === 'trigger') {
      currentItem = node?.conditions?.[index]
    } else if (formType === 'sub-workflow') {
      currentItem = node.subflow
    } else if (formType === 'variableType') {
      currentItem = data
    } else if (formType === 'variable') {
      currentItem = node?.variable
    }

    const isQnA = this.props.selectedWorkflow === 'qna'
    const { currentTab } = this.state

    return (
      <Fragment>
        {isQnA && (
          <InjectedModuleView
            key={`${this.props.selectedTopic}`}
            moduleName="qna"
            componentName="LiteEditor"
            contentLang={this.props.contentLang}
            extraProps={{
              isLite: true,
              topicName: this.props.selectedTopic,
              languages: this.props.languages,
              defaultLanguage: this.props.defaultLanguage,
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
        <MainContent.Wrapper className={cx({ [style.hidden]: isQnA })}>
          <WorkflowToolbar
            currentLang={this.state.currentLang}
            languages={this.props.languages}
            currentTab={this.state.currentTab}
            setCurrentLang={lang => this.setState({ currentLang: lang })}
            addVariable={this.addVariable}
            tabChange={this.handleTabChanged}
          />
          {currentTab === 'variables' && <VariablesEditor editVariable={this.editVariable} />}
          <Fragment>
            <div
              id="diagramContainer"
              ref={ref => (this.diagramContainer = ref)}
              tabIndex={1}
              className={style.diagramContainer}
              style={{
                display: currentTab === 'workflow' ? 'inherit' : 'none'
              }}
              onContextMenu={this.handleContextMenu}
              onDrop={this.handleToolDropped}
              onDragOver={event => event.preventDefault()}
            >
              {this.renderSearch()}
              <DiagramWidget
                ref={w => (this.diagramWidget = w)}
                deleteKeys={[]}
                diagramEngine={this.diagramEngine}
                maxNumberPointsPerLink={0}
                inverseZoom={true}
              />
            </div>

            {currentTab === 'workflow' && <Toolbar />}
          </Fragment>

          {formType === 'say_something' && (
            <ContentForm
              customKey={`${node.id}${index}`}
              contentTypes={this.props.contentTypes.filter(type =>
                type.schema.newJson?.displayedIn.includes('sayNode')
              )}
              deleteContent={() => this.deleteNodeContent()}
              variables={this.props.variables}
              events={this.props.hints || []}
              contentLang={this.state.currentLang}
              editingContent={index}
              formData={currentItem || getEmptyContent(currentItem)}
              onUpdate={this.updateNodeContent.bind(this)}
              onUpdateVariables={this.addVariable}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'trigger' && (
            <ConditionForm
              customKey={`${node.id}${index}`}
              conditions={this.props.conditions}
              deleteCondition={() => this.deleteNodeCondition()}
              editingCondition={index}
              topicName={this.props.selectedTopic}
              variables={this.props.variables}
              events={this.props.hints}
              formData={currentItem}
              contentLang={this.state.currentLang}
              onUpdate={this.updateNodeCondition.bind(this)}
              onUpdateVariables={this.addVariable}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'prompt' && (
            <PromptForm
              prompts={this.props.prompts}
              customKey={`${node?.id}${node?.prompt?.type}`}
              formData={node?.prompt}
              onUpdate={this.updatePromptNode.bind(this)}
              deletePrompt={this.deleteSelectedElements.bind(this)}
              variables={this.props.variables}
              onUpdateVariables={this.addVariable}
              contentLang={this.state.currentLang}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'execute' && (
            <ExecuteForm
              node={this.props.currentFlowNode}
              deleteNode={this.deleteSelectedElements.bind(this)}
              diagramEngine={this.diagramEngine}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'action' && (
            <ActionForm
              node={this.props.currentFlowNode}
              deleteNode={this.deleteSelectedElements.bind(this)}
              diagramEngine={this.diagramEngine}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'sub-workflow' && (
            <SubWorkflowForm
              variables={this.props.variables}
              node={this.props.currentFlowNode}
              customKey={`${node?.id}${node?.type}`}
              updateSubWorkflow={this.updateSubWorkflow}
              onUpdateVariables={this.addVariable}
              formData={currentItem}
              flows={this.props.flows}
              type={index === 0 ? 'in' : 'out'}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
          {formType === 'variableType' && (
            <VariableTypesForm
              contentLang={this.state.currentLang}
              customKey={data.id}
              formData={currentItem}
              variables={this.props.variables}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}

          {formType === 'variable' && (
            <VariableForm
              variables={this.props.variables}
              contentLang={this.state.currentLang}
              customKey={`${node?.id}${node?.prompt?.type}`}
              deleteVariable={this.deleteVariable.bind(this)}
              formData={currentItem}
              currentFlow={this.props.currentFlow}
              onUpdate={this.updateFlowVariable.bind(this)}
              close={() => {
                this.timeout = setTimeout(() => {
                  this.setState({ editingNodeItem: null })
                }, 200)
              }}
            />
          )}
        </MainContent.Wrapper>
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
  currentDiagramAction: state.flows.currentDiagramAction,
  canPasteNode: Boolean(state.flows.nodeInBuffer),
  skills: state.skills.installed,
  library: state.content.library,
  prompts: getPrompts(state),
  variables: getVariables(state),
  contentTypes: state.content.categories,
  conditions: state.ndu.conditions,
  hints: state.hints.inputs,
  activeFormItem: state.flows.activeFormItem
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
  refreshHints,
  setActiveFormItem
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps, null, {
  withRef: true
})(withLanguage(Diagram))
