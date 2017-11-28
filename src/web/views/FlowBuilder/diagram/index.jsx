import React, { Component } from 'react'
import { Button, Label } from 'react-bootstrap'

import ReactDOM from 'react-dom'
import classnames from 'classnames'
import _ from 'lodash'

import { hashCode } from '~/util'

const {
  DiagramWidget,
  DiagramEngine,
  DefaultNodeFactory,
  DefaultLinkFactory,
  DiagramModel,
  LinkModel,
  PointModel
} = require('storm-react-diagrams')

import { StandardNodeModel, StandardWidgetFactory } from './nodes/StandardNode'

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {}

    this.diagramEngine = new DiagramEngine()

    this.diagramEngine.registerNodeFactory(new DefaultNodeFactory())
    this.diagramEngine.registerNodeFactory(new StandardWidgetFactory())

    this.diagramEngine.registerLinkFactory(new DefaultLinkFactory())

    this.setModel()
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

    const currentFlow = this.props.currentFlow
    if (!currentFlow) {
      return
    }

    const nodes = currentFlow.nodes.map(node => {
      const model = new StandardNodeModel({ ...node, isStartNode: currentFlow.startNode === node.name })
      model.x = model.oldX = node.x
      model.y = model.oldY = node.y

      return model
    })

    nodes.forEach(node => this.activeModel.addNode(node))
    nodes.forEach(node => this.createNodeLinks(node, nodes, this.props.currentFlow.links))

    this.diagramEngine.setDiagramModel(this.activeModel)
    this.diagramWidget && this.diagramWidget.forceUpdate()
  }

  createNodeLinks(node, allNodes, existingLinks = []) {
    if (!_.isArray(node.next)) {
      return
    }

    node.next.forEach((next, index) => {
      const target = next.node
      if (/END/i.test(target)) {
        // Handle end connection
      } else if (target.indexOf('.') !== -1) {
        // Handle subflow connection
      } else {
        const sourcePort = node.ports['out' + index]
        const targetNode = _.find(allNodes, { name: next.node })

        if (!targetNode) {
          // TODO Show warning that target node doesn't exist
          return
        }

        const existingLink = _.find(existingLinks, { source: node.id, target: targetNode.id })
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
    let snapshot = _.memoize(::this.serialize) // Don't serialize more than once

    // Remove nodes that have been deleted
    _.keys(this.activeModel.getNodes()).forEach(nodeId => {
      if (!_.find(this.props.currentFlow.nodes, { id: nodeId })) {
        this.deleteNode(nodeId)
      }
    })

    this.props.currentFlow &&
      this.props.currentFlow.nodes.forEach(node => {
        let model = this.activeModel.getNode(node.id)

        if (!model) {
          // Node doesn't exist
          this.addNode(node)
        } else if (model.lastModified !== node.lastModified) {
          // Node has been modified
          this.syncNode(node, model, snapshot())
        } else {
          model.setData({
            name: node.name,
            onEnter: node.onEnter,
            onReceive: node.onReceive,
            next: node.next,
            isStartNode: this.props.currentFlow.startNode === node.name
          })
        }
      })

    this.diagramWidget.forceUpdate()
  }

  addNode(node) {
    const model = new StandardNodeModel({ ...node, isStartNode: this.props.currentFlow.startNode === node.name })
    model.x = model.oldX = node.x
    model.y = model.oldY = node.y
    this.activeModel.addNode(model)

    setTimeout(() => {
      // Select newly inserted nodes
      model.setSelected(true)
      this.props.switchFlowNode(node.id)
    }, 150)

    model.setData({
      name: node.name,
      onEnter: node.onEnter,
      onReceive: node.onReceive,
      next: node.next,
      isStartNode: this.props.currentFlow.startNode === node.name
    })

    model.lastModified = node.lastModified
  }

  syncNode(node, model, snapshot) {
    model.setData({
      name: node.name,
      onEnter: node.onEnter,
      onReceive: node.onReceive,
      next: node.next,
      isStartNode: this.props.currentFlow.startNode === node.name
    })

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
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('click', ::this.onDiagramClick)
    document.getElementById('diagramContainer').addEventListener('keyup', ::this.onKeyUp)
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('click', ::this.onDiagramClick)
    document.getElementById('diagramContainer').removeEventListener('keyup', ::this.onKeyUp)
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.currentFlow || _.get(prevProps, 'currentFlow.name') !== _.get(this, 'props.currentFlow.name')) {
      // Update the diagram model only if we changed the current flow
      this.setModel()
    } else {
      // Update the current model with the new properties
      this.syncModel()
    }
  }

  onDiagramClick(event) {
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
      ;[link.sourcePort, link.targetPort].forEach(port => {
        if (!port) {
          return
        }
        const portLinks = _.values(port.links)
        if (port.name.startsWith('out') && portLinks.length > 1) {
          _.last(portLinks).remove()
          this.diagramWidget.forceUpdate()
        }
      })

      // We make sure that the link was added to the node
      const outPort = link.sourcePort.name.startsWith('out') ? link.sourcePort : link.targetPort
      const targetPort = link.sourcePort.name.startsWith('out') ? link.targetPort : link.sourcePort
      const outIndex = Number(outPort.name.substr(3))
      const next = outPort.parentNode.next[outIndex]
      if (next.node !== targetPort.parentNode.name) {
        console.log('LINK ', outPort.parentNode.name, '-->', targetPort.parentNode.name)
        this.props.linkFlowNodes({
          node: outPort.parentNode.id,
          index: outIndex,
          condition: next.condition,
          target: targetPort.parentNode.name
        }) // Update node that isn't selected
      }
    })

    if (this.props.currentDiagramAction && this.props.currentDiagramAction.startsWith('insert_')) {
      let { x, y } = this.diagramEngine.getRelativePoint(event.clientX, event.clientY)

      const zoomFactor = this.activeModel.getZoomLevel() / 100

      x /= zoomFactor
      y /= zoomFactor

      x -= this.activeModel.getOffsetX() / zoomFactor
      y -= this.activeModel.getOffsetY() / zoomFactor

      this.props.createFlowNode({ x, y })
      this.props.setDiagramAction(null)
    }

    // No node selected
    if (!selectedNode && currentNode) {
      return this.props.switchFlowNode(null)
    }

    // Selected a new node
    if (selectedNode && (!currentNode || selectedNode.id !== currentNode.id)) {
      this.props.switchFlowNode(selectedNode.id)
    }

    if (selectedNode) {
      if (selectedNode.oldX !== selectedNode.x || selectedNode.oldY !== selectedNode.y) {
        this.props.updateFlowNode({
          x: selectedNode.x,
          y: selectedNode.y
        })
      }

      selectedNode.oldX = selectedNode.x
      selectedNode.oldY = selectedNode.y
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
      this.props.updateFlow({
        links: newLinks
      })
    }
  }

  serialize() {
    const model = this.activeModel.serializeDiagram()

    const nodes = model.nodes.map(node => {
      return {
        id: node.id,
        name: node.name,
        onEnter: node.onEnter,
        onReceive: node.onReceive,
        next: node.next.map((next, index) => {
          const port = _.find(node.ports, { name: 'out' + index })

          if (!port || !port.links || !port.links.length) {
            return next
          }

          const link = _.find(model.links, { id: port.links[0] })
          const otherNodeId = link.source === node.id ? link.target : link.source
          const otherNode = _.find(model.nodes, { id: otherNodeId })

          if (!otherNode) {
            return next
          }

          return { condition: next.condition, node: otherNode.name }
        }),
        position: {
          x: node.x,
          y: node.y
        }
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
    // const { nodes, links } = this.serialize()
    this.props.saveAllFlows()
  }

  deleteSelectedElements() {
    let elements = this.diagramEngine.getDiagramModel().getSelectedItems()
    elements = _.sortBy(elements, 'nodeType')

    // Use sorting to make the nodes first in the array, deleting the node before the links
    for (let element of elements) {
      if (!this.diagramEngine.isModelLocked(element)) {
        if (element.isStartNode) {
          return alert("You can't delete the start node.")
        } else if (element.nodeType === 'standard') {
          this.props.removeFlowNode(element.id)
        } else {
          // it's a link, a point or something else
          element.remove()
        }
      }
    }

    this.diagramWidget.forceUpdate()
  }

  onKeyUp(event) {
    if (event.code === 'Backspace') {
      this.deleteSelectedElements()
    }
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
        <DiagramWidget ref={w => (this.diagramWidget = w)} deleteKeys={[]} diagramEngine={this.diagramEngine} />
      </div>
    )
  }
}
