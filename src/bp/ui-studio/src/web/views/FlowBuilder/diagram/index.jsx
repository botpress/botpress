import React, { Component } from 'react'
import { Button, Label } from 'react-bootstrap'

import ReactDOM from 'react-dom'
import classnames from 'classnames'
import _ from 'lodash'
import { DiagramWidget, DiagramEngine, DiagramModel, LinkModel, PointModel } from 'storm-react-diagrams'
import { toast } from 'react-toastify'

import { hashCode } from '~/util'

import { StandardNodeModel, StandardWidgetFactory } from './nodes/StandardNode'
import { SkillCallNodeModel, SkillCallWidgetFactory } from './nodes/SkillCallNode'
import { DeletableLinkFactory } from './nodes/LinkWidget'

const style = require('./style.scss')

const passThroughNodeProps = ['name', 'onEnter', 'onReceive', 'next', 'skill']
const PADDING = 100

const createNodeModel = (node, props) => {
  if (node.type && node.type === 'skill-call') {
    return new SkillCallNodeModel({ ...props })
  } else {
    return new StandardNodeModel({ ...props })
  }
}

export default class FlowBuilder extends Component {
  highlightedNodeName = undefined

  constructor(props) {
    super(props)
    this.state = {}

    this.diagramEngine = new DiagramEngine()

    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())
    this.diagramEngine.registerNodeFactory(new SkillCallWidgetFactory())
    this.diagramEngine.registerLinkFactory(new DeletableLinkFactory())

    this.setModel()

    window.highlightNode = (flow, node) => {
      this.highlightedNodeName = node

      if (!flow || !node) {
        // Refreshing the model anyway, to remove the highlight if node is undefined
        this.setModel()
        return
      }

      try {
        if (this.props.currentFlow.name !== flow) {
          this.props.switchFlow(flow)
        } else {
          this.setModel()
        }
      } catch (err) {
        console.error('Error when switching flow or refreshing', err)
      }
    }
  }

  async checkForNodeSearch() {
    const { hash } = window.location
    const searchCmd = '#search:'

    if (hash && hash.includes(searchCmd)) {
      const chosenNode = this.props.currentFlow.nodes.find(node => node.name === hash.replace(searchCmd, ''))
      await this.props.switchFlowNode(chosenNode.id)
      await this.props.openFlowNodeProps()
    }
  }

  checkForProblems() {
    const nodes = this.activeModel.getNodes()
    const nodesWithProblems = Object.keys(nodes)
      .map(node => ({
        nodeName: nodes[node].name,
        missingPorts: nodes[node].next.filter(n => n.node === '').length
      }))
      .filter(x => x.missingPorts > 0)

    this.props.updateFlowProblems(nodesWithProblems)
  }

  setTranslation(x = 0, y = 0) {
    this.activeModel.setOffset(x, y)
    this.diagramWidget.fireAction()
    this.diagramWidget.forceUpdate()
  }

  createFlow(name) {
    this.props.createFlow(name + '.flow.json')
  }

  setModel() {
    this.activeModel = new DiagramModel()
    this.activeModel.setGridSize(5)
    this.activeModel.linksHash = null
    this.activeModel.setLocked(this.props.readOnly)

    const currentFlow = this.props.currentFlow
    if (!currentFlow) {
      return
    }

    let centeredElement
    const nodes = currentFlow.nodes.map(node => {
      const model = createNodeModel(node, {
        ...node,
        isStartNode: currentFlow.startNode === node.name,
        isHighlighted: this.highlightedNodeName === node.name
      })
      model.x = model.oldX = node.x
      model.y = model.oldY = node.y

      if (this.highlightedNodeName === node.name) {
        centeredElement = { x: model.x, y: model.x }
      }

      return model
    })

    nodes.forEach(node => this.activeModel.addNode(node))
    nodes.forEach(node => this.createNodeLinks(node, nodes, this.props.currentFlow.links))

    this.diagramEngine.setDiagramModel(this.activeModel)

    const diagramContainer = document.getElementById('diagramContainer')

    if (diagramContainer) {
      const diagramWidth = diagramContainer.offsetWidth
      const diagramHeight = diagramContainer.offsetHeight
      const totalFlowWidth = _.max(nodes.map(({ x }) => x)) - _.min(nodes.map(({ x }) => x))
      const totalFlowHeight = _.max(nodes.map(({ y }) => y)) - _.min(nodes.map(({ y }) => y))
      const zoomLevelX = Math.min(1, diagramWidth / (totalFlowWidth + 2 * PADDING))
      const zoomLevelY = Math.min(1, diagramHeight / (totalFlowHeight + 2 * PADDING))
      const zoomLevel = Math.min(zoomLevelX, zoomLevelY)

      const offsetX = PADDING - _.min(nodes.map(({ x }) => x))
      const offsetY = PADDING - _.min(nodes.map(({ y }) => y))

      this.activeModel.setZoomLevel(zoomLevel * 100)
      this.activeModel.setOffsetX(offsetX * zoomLevel)
      this.activeModel.setOffsetY(offsetY * zoomLevel)

      this.diagramWidget && this.diagramWidget.forceUpdate()
    }

    this.checkForProblems()
  }

  clearModel() {
    this.activeModel = new DiagramModel()
    this.activeModel.setGridSize(5)
    this.activeModel.linksHash = null
    this.activeModel.setLocked(this.props.readOnly)

    this.diagramEngine.setDiagramModel(this.activeModel)
    this.diagramWidget && this.diagramWidget.forceUpdate()
  }

  createNodeLinks(node, allNodes, existingLinks = []) {
    if (!_.isArray(node.next)) {
      return
    }

    node.next.forEach((next, index) => {
      const target = next.node
      if (/^END$/i.test(target)) {
        // Handle end connection
      } else if (/\.flow/i.test(target)) {
        // Handle subflow connection
      } else {
        const sourcePort = node.ports['out' + index]
        const targetNode = _.find(allNodes, { name: next.node })

        if (!targetNode) {
          // TODO Show warning that target node doesn't exist
          return
        }

        const existingLink = _.find(existingLinks, {
          source: node.id,
          target: targetNode.id,
          sourcePort: sourcePort.name
        })
        const targetPort = targetNode.ports['in']
        const link = new LinkModel()
        link.setSourcePort(sourcePort)
        link.setTargetPort(targetPort)

        if (existingLink) {
          link.setPoints(
            existingLink.points.map(pt => {
              return new PointModel(link, { x: pt.x, y: pt.y })
            })
          )
        }

        this.activeModel.addLink(link)
      }
    })
  }

  deleteNode(nodeId) {
    const ports = this.activeModel.getNode(nodeId).getPorts()
    this.activeModel.removeNode(nodeId)
    _.values(ports).forEach(port => {
      _.values(port.getLinks()).forEach(link => {
        this.activeModel.removeLink(link)
      })
    })
  }

  syncModel() {
    // Don't serialize more than once
    const snapshot = _.once(this.serialize)

    // Remove nodes that have been deleted
    _.keys(this.activeModel.getNodes()).forEach(nodeId => {
      if (!_.find(this.props.currentFlow.nodes, { id: nodeId })) {
        this.deleteNode(nodeId)
      }
    })

    this.props.currentFlow &&
      this.props.currentFlow.nodes.forEach(node => {
        const model = this.activeModel.getNode(node.id)

        if (!model) {
          // Node doesn't exist
          this.addNode(node)
        } else if (model.lastModified !== node.lastModified) {
          // Node has been modified
          this.syncNode(node, model, snapshot())
        } else {
          model.setData({
            ..._.pick(node, passThroughNodeProps),
            isStartNode: this.props.currentFlow.startNode === node.name
          })
        }
      })

    this.activeModel.setLocked(this.props.readOnly)
    this.diagramWidget.forceUpdate()
  }

  addNode(node) {
    const model = createNodeModel(node, { ...node, isStartNode: this.props.currentFlow.startNode === node.name })
    model.x = model.oldX = node.x
    model.y = model.oldY = node.y
    this.activeModel.addNode(model)

    setTimeout(() => {
      // Select newly inserted nodes
      model.setSelected(true)
      this.props.switchFlowNode(node.id)
    }, 150)

    model.setData({
      ..._.pick(node, passThroughNodeProps),
      isStartNode: this.props.currentFlow.startNode === node.name,
      isHighlighted: this.highlightedNodeName === node.name
    })

    model.lastModified = node.lastModified
  }

  syncNode(node, model, snapshot) {
    model.setData({
      ..._.pick(node, passThroughNodeProps),
      isStartNode: this.props.currentFlow.startNode === node.name,
      isHighlighted: this.highlightedNodeName === node.name
    })

    model.setPosition(node.x, node.y)

    const ports = model.getOutPorts()
    ports.forEach(port => {
      _.values(port.links).forEach(link => {
        this.activeModel.removeLink(link)
        port.removeLink(link)
      })
    })

    // Recreate all the links
    // If there's an existing link saved for target,port .. reuse the point locations

    const allNodes = _.values(this.activeModel.getNodes())
    this.createNodeLinks(model, allNodes, snapshot.links)

    model.lastModified = node.lastModified
  }

  getSelectedNode() {
    return _.first(this.activeModel.getSelectedItems() || [], { selected: true })
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

  componentDidUpdate(prevProps) {
    if (!this.props.currentFlow) {
      // Clear the active model
      this.clearModel()
    } else if (
      !prevProps.currentFlow ||
      _.get(prevProps, 'currentFlow.name') !== _.get(this, 'props.currentFlow.name')
    ) {
      // Update the diagram model only if we changed the current flow
      this.setModel()
    } else {
      // Update the current model with the new properties
      this.syncModel()
    }

    if (this.props.currentFlow && !prevProps.currentFlow) {
      this.checkForNodeSearch()
    }
  }

  onDiagramDoubleClick = () => {
    this.props.openFlowNodeProps()
  }

  onDiagramClick = event => {
    const selectedNode = this.getSelectedNode()
    const currentNode = this.props.currentFlowNode

    // Sanitizing the links, making sure that:
    // 1) All links are connected to ONE [out] and [in] port
    // 2) All ports have only ONE outbound link
    const links = _.values(this.activeModel.getLinks())
    links.forEach(link => {
      // If there's not two ports attached to the link
      if (!link.sourcePort || !link.targetPort) {
        link.remove()
        return this.diagramWidget.forceUpdate()
      }

      // We need at least one input port
      if (link.sourcePort.name !== 'in' && link.targetPort.name !== 'in') {
        link.remove()
        return this.diagramWidget.forceUpdate()
      }

      // We need at least one output port
      if (!link.sourcePort.name.startsWith('out') && !link.targetPort.name.startsWith('out')) {
        link.remove()
        return this.diagramWidget.forceUpdate()
      }

      // If ports have more than one outbout link
      const ports = [link.sourcePort, link.targetPort]
      ports.forEach(port => {
        if (!port) {
          return
        }
        const portLinks = _.values(port.links)
        if (port.name.startsWith('out') && portLinks.length > 1) {
          _.last(portLinks).remove()
          this.diagramWidget.forceUpdate()
        }
      })

      // We don't want to link node to itself
      const outPort = link.sourcePort.name.startsWith('out') ? link.sourcePort : link.targetPort
      const targetPort = link.sourcePort.name.startsWith('out') ? link.targetPort : link.sourcePort
      if (outPort.parentNode.id === targetPort.parentNode.id) {
        link.remove()
        return this.diagramWidget.forceUpdate()
      }
    })

    if (this.props.currentDiagramAction && this.props.currentDiagramAction.startsWith('insert_')) {
      let { x, y } = this.diagramEngine.getRelativePoint(event.clientX, event.clientY)

      const zoomFactor = this.activeModel.getZoomLevel() / 100

      x /= zoomFactor
      y /= zoomFactor

      x -= this.activeModel.getOffsetX() / zoomFactor
      y -= this.activeModel.getOffsetY() / zoomFactor

      if (this.props.currentDiagramAction === 'insert_skill') {
        this.props.insertNewSkillNode({ x, y })
      } else {
        this.props.createFlowNode({ x, y })
      }

      this.props.setDiagramAction(null)
    }

    if (!selectedNode && currentNode) {
      this.props.switchFlowNode(null) // No node selected
    } else if (selectedNode && (!currentNode || selectedNode.id !== currentNode.id)) {
      this.props.switchFlowNode(selectedNode.id) // Selected a new node
    }

    if (selectedNode && (selectedNode.oldX !== selectedNode.x || selectedNode.oldY !== selectedNode.y)) {
      this.props.updateFlowNode({ x: selectedNode.x, y: selectedNode.y })
      Object.assign(selectedNode, { oldX: selectedNode.x, oldY: selectedNode.y })
    }

    this.checkForLinksUpdate()
  }

  checkForLinksUpdate() {
    const newLinks = this.serializeLinks()
    const newLinksHash = hashCode(JSON.stringify(newLinks))

    if (!this.activeModel.linksHash) {
      this.activeModel.linksHash = newLinksHash
    }

    if (this.activeModel.linksHash !== newLinksHash) {
      this.activeModel.linksHash = newLinksHash
      this.props.updateFlow({ links: newLinks })
    }
    this.checkForProblems()
  }

  serialize = () => {
    const model = this.activeModel.serializeDiagram()

    const nodes = model.nodes.map(node => {
      return {
        ..._.pick(node, 'id', 'name', 'onEnter', 'onReceive'),
        next: node.next.map((next, index) => {
          const port = _.find(node.ports, { name: 'out' + index })

          if (!port || !port.links || !port.links.length) {
            return next
          }

          const link = _.find(model.links, { id: port.links[0] })
          const otherNodeId = link && (link.source === node.id ? link.target : link.source)
          const otherNode = _.find(model.nodes, { id: otherNodeId })

          if (!otherNode) {
            return next
          }

          return { condition: next.condition, node: otherNode.name }
        }),
        position: _.pick(node, 'x', 'y')
      }
    })

    const links = this.serializeLinks()

    return { links, nodes }
  }

  serializeLinks() {
    const diagram = this.activeModel.serializeDiagram()

    return diagram.links.map(link => {
      const instance = this.activeModel.getLink(link.id)
      const model = {
        source: link.source,
        sourcePort: instance.sourcePort.name,
        target: link.target,
        points: link.points.map(pt => ({ x: pt.x, y: pt.y }))
      }

      if (instance.sourcePort.name === 'in') {
        // We reverse the model so that target is always an input port
        model.source = link.target
        model.sourcePort = instance.targetPort.name
        model.target = link.source
        model.points = _.reverse(model.points)
      }

      return model
    })
  }

  saveAllFlows() {
    this.props.saveAllFlows()
  }

  deleteSelectedElements() {
    const elements = _.sortBy(this.diagramEngine.getDiagramModel().getSelectedItems(), 'nodeType')

    // Use sorting to make the nodes first in the array, deleting the node before the links
    for (const element of elements) {
      if (!this.diagramEngine.isModelLocked(element)) {
        if (element.isStartNode) {
          return alert("You can't delete the start node.")
        } else if (
          _.includes(['standard', 'skill-call'], element.nodeType) ||
          _.includes(['standard', 'skill-call'], element.type)
        ) {
          this.props.removeFlowNode(element.id)
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
    toast('Copied to buffer!', {
      autoClose: 1000,
      position: toast.POSITION.TOP_CENTER,
      hideProgressBar: true,
      closeButton: false
    })
  }

  pasteElementFromBuffer() {
    this.props.pasteFlowNode({ x: -this.activeModel.offsetX + PADDING, y: -this.activeModel.offsetY + PADDING })
    this.getSelectedNode().setSelected(false)
  }

  onKeyDown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      this.copySelectedElementToBuffer()
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      this.pasteElementFromBuffer()
    } else if (event.code === 'Backspace' || event.code === 'Delete') {
      this.deleteSelectedElements()
    }
  }

  handleFlowWideClicked = () => {
    this.activeModel.clearSelection()
    this.onDiagramDoubleClick()
  }

  renderCatchAllInfo() {
    const nbNext = _.get(this.props.currentFlow, 'catchAll.next.length', 0)

    return (
      <div>
        <Button bsStyle="link" onClick={this.handleFlowWideClicked}>
          <Label bsStyle={nbNext > 0 ? 'primary' : 'default'}>{nbNext}</Label> flow-wide
          {nbNext === 1 ? ' transition' : ' transitions'}
        </Button>
      </div>
    )
  }

  render() {
    const isInserting = this.props.currentDiagramAction && this.props.currentDiagramAction.startsWith('insert_')
    const classNames = classnames({ [style.insertNode]: isInserting })
    const cancelInsert = () => this.props.setDiagramAction(null)

    return (
      <div
        id="diagramContainer"
        tabIndex="1"
        className={classNames}
        style={{ outline: 'none', width: '100%', height: '100%' }}
      >
        <div className={style.floatingInfo}>
          {this.renderCatchAllInfo()}
          {isInserting && (
            <div className={style.insertMode}>
              <div>
                <Label bsStyle="primary">Insertion Mode</Label>
              </div>
              <Button bsStyle="danger" onClick={cancelInsert}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        <DiagramWidget
          readOnly={this.props.readOnly}
          ref={w => (this.diagramWidget = w)}
          deleteKeys={[]}
          diagramEngine={this.diagramEngine}
        />
      </div>
    )
  }
}
