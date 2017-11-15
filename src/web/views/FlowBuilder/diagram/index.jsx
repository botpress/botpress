import React, { Component } from 'react'
import { Button, Label } from 'react-bootstrap'

import ReactDOM from 'react-dom'
import classnames from 'classnames'
import _ from 'lodash'

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

  serialize() {
    return this.activeModel.serializeDiagram()
  }

  setModel() {
    this.activeModel = new DiagramModel()
    this.activeModel.setGridSize(25)

    // this.activeModel.addListener({
    //   linksUpdated: (entity, isAdded) => {
    //     console.log('LINK UPDATED --->', entity, isAdded)
    //   }
    // })

    const currentFlow = this.props.currentFlow
    if (!currentFlow) {
      return
    }

    const linksToCreate = []

    const nodes = currentFlow.nodes.map(node => {
      const model = new StandardNodeModel({ ...node, isStartNode: currentFlow.startNode === node.name })
      model.x = node.x
      model.y = node.y

      return model
    })

    nodes.map(node => {
      if (_.isArray(node.next)) {
        node.next.forEach((next, index) => {
          const target = next.node
          if (/END/i.test(target)) {
            // Handle end connection
          } else if (target.indexOf('.') !== -1) {
            // Handle subflow connection
          } else {
            const sourcePort = node.ports['out' + index]
            const targetNode = _.find(nodes, { name: next.node })

            if (!targetNode) {
              // TODO Show warning that target node doesn't exist
              return
            }

            const existingLink = _.find(currentFlow.links, { source: node.id, target: targetNode.id })

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

            linksToCreate.push(link)
          }
        })
      }
    })

    nodes.forEach(node => this.activeModel.addNode(node))
    linksToCreate.forEach(link => this.activeModel.addLink(link))

    this.diagramEngine.setDiagramModel(this.activeModel)
    this.diagramWidget.forceUpdate()
  }

  syncModel() {
    // Remove nodes that have been deleted
    _.keys(this.activeModel.getNodes()).forEach(nodeId => {
      if (!_.find(this.props.currentFlow.nodes, { id: nodeId })) {
        const ports = this.activeModel.getNode(nodeId).getPorts()
        this.activeModel.removeNode(nodeId)
        _.values(ports).forEach(port => {
          _.values(port.getLinks()).forEach(link => {
            this.activeModel.removeLink(link)
          })
        })
      }
    })

    this.props.currentFlow &&
      this.props.currentFlow.nodes.forEach(node => {
        const model = this.activeModel.getNode(node.id)

        if (model === null) {
          // Node was added
          const model = new StandardNodeModel({ ...node, isStartNode: this.props.currentFlow.startNode === node.name })
          model.x = node.x
          model.y = node.y
          this.activeModel.addNode(model)
        }

        _.assign(model, {
          name: node.name,
          onEnter: node.onEnter,
          onReceive: node.onReceive,
          next: node.next,
          isStartNode: this.props.currentFlow.startNode === node.name
        })
      })

    this.diagramWidget.forceUpdate()
  }

  getSelectedNode() {
    return _.first(this.activeModel.getSelectedItems() || [], { selected: true })
  }

  componentDidMount() {
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('mousedown', ::this.onDiagramClick)
    ReactDOM.findDOMNode(this.diagramWidget).addEventListener('click', ::this.onDiagramClick)
    document.getElementById('diagramContainer').addEventListener('keyup', ::this.onKeyUp)
  }

  componentWillUnmount() {
    ReactDOM.findDOMNode(this.diagramWidget).removeEventListener('mousedown', ::this.onDiagramClick)
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
  }

  saveFlow() {
    const model = this.serialize()

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

    const links = model.links.map(link => {
      return {
        source: link.source,
        target: link.target,
        points: link.points.map(pt => ({ x: pt.x, y: pt.y }))
      }
    })

    const currentFlow = this.props.currentFlow

    this.props.saveFlow({
      flow: currentFlow.name,
      location: currentFlow.location,
      startNode: currentFlow.startNode,
      catchAll: currentFlow.catchAll,
      links: links,
      nodes: nodes
    })
  }

  onKeyUp(event) {
    if (event.code === 'Backspace') {
      const elements = this.diagramEngine.getDiagramModel().getSelectedItems()
      elements.forEach(element => {
        if (!this.diagramEngine.isModelLocked(element)) {
          element.remove()
        }
      })
      this.diagramWidget.forceUpdate()
    }
  }

  render() {
    const isInserting = this.props.currentDiagramAction && this.props.currentDiagramAction.startsWith('insert_')
    const classNames = classnames({ [style.insertNode]: isInserting })
    const cancelInsert = () => this.props.setDiagramAction(null)

    return (
      <div id="diagramContainer" tabIndex="1" className={classNames} style={{ width: '100%', height: '100%' }}>
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
