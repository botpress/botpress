import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

// import { ListGroup, ListGroupItem, Popover, Button, MenuItem, Overlay } from 'react-bootstrap'

import get from 'lodash/get'

import Tree from './tree'
import { buildFlowsTree, getUniqueId } from './util'

const style = require('./style.scss')

const setNodeStates = (nodes, toggledNodes, activeNode) => {
  if (!nodes) {
    return
  }
  nodes.forEach(node => {
    const id = getUniqueId(node)
    if (toggledNodes[id]) {
      node.toggled = true
    } else if (id === activeNode) {
      node.active = true
    }
    setNodeStates(node.children, toggledNodes, activeNode)
  })
}

const getInitialState = currentFlow => {
  if (!currentFlow) {
    return {
      toggledNodes: {},
      activeNode: null
    }
  }

  const flowPath = currentFlow.name.replace(/\.flow\.json$/, '').split('/')
  const flowName = flowPath[flowPath.length - 1]
  const folders = flowPath.slice(0, flowPath.length - 1)
  const toggledNodes = {}
  const currentPath = []
  while (folders.length) {
    currentPath.push(folders.shift())
    toggledNodes[`folder:${currentPath.join('/')}`] = true
  }
  currentPath.push(flowName)
  return {
    toggledNodes,
    activeNode: `file:${currentPath.join('/')}`
  }
}

export default class FlowsList extends Component {
  // renderFlow(flow, index) {
  //   const hideOverlay = () => {
  //     this.setState({
  //       showDropdownIndex: -1
  //     })
  //   }

  //   const handleDelete = () => {
  //     hideOverlay()
  //     setTimeout(() => {
  //       if (confirm('Are you sure you want to delete this flow?') === true) {
  //         this.props.deleteFlow(flow.name)
  //       }
  //     }, 250)
  //   }

  //   const handleDuplicate = () => {
  //     hideOverlay()

  //     setTimeout(() => {
  //       let name = prompt('Enter the name of the new flow')

  //       if (!name) {
  //         return
  //       }

  //       name = name.replace(/\.flow\.json$/i, '')

  //       if (/[^A-Z0-9-_\/]/i.test(name)) {
  //         return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
  //       }

  //       if (_.includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
  //         return alert('ERROR: This flow already exists')
  //       }

  //       this.props.duplicateFlow({ flowNameToDuplicate: flow.name, name: `${name}.flow.json` })
  //     }, 250)
  //   }

  //   const dropdown = (
  //     <Popover id={`flow-${index}-dropdown`} bsClass={classnames(style.popover, 'popover')}>
  //       <ul className={style.menu}>
  //         {flow.name !== 'main.flow.json' && <li onClick={handleDelete}>Delete</li>}
  //         <li onClick={handleDuplicate}>Duplicate</li>
  //       </ul>
  //     </Popover>
  //   )

  //   const overlayShown = this.state.showDropdownIndex === index

  //   const showOverlay = () => {
  //     this.setState({
  //       showDropdownIndex: index
  //     })
  //   }

  //   const ref = 'menu-btn-' + index

  //   const caret = (
  //     <Button bsSize="xsmall" ref={ref} onClick={showOverlay}>
  //       <span className="caret" />
  //     </Button>
  //   )

  //   const overlay = (
  //     <Overlay
  //       onHide={hideOverlay}
  //       show={overlayShown}
  //       animation={false}
  //       trigger="click"
  //       rootClose
  //       placement="bottom"
  //       target={() => ReactDOM.findDOMNode(this.refs[ref])}
  //     >
  //       {dropdown}
  //     </Overlay>
  //   )

  //   const lgProps = isCurrentFlow ? { key: index } : { href: 'javascript:void(0);', key: index }

  //   return (
  //     <ListGroupItem {...lgProps}>
  //       <div className={style.menuButton}>{caret}</div>
  //       {overlay}
  //     </ListGroupItem>
  //   )
  // }

  buildTreeData() {
    const { flows, currentFlow, dirtyFlows } = this.props
    const nodes = buildFlowsTree(flows)
    if (this.state) {
      setNodeStates(nodes, this.state.toggledNodes, this.state.activeNode)
    }
    return nodes
  }

  toggleTreeNode = (node, toggled) => {
    const toggledNodes = { ...this.state.toggledNodes }
    let activeNode = this.state.activeNode

    if (node.type === 'folder') {
      const id = getUniqueId(node)
      toggledNodes[id] = !toggledNodes[id]
    } else if (node.type === 'file') {
      // set the node itself as active
      activeNode = getUniqueId(node)
      // make all of its parents expanded
      let parent = node.parent
      while (parent) {
        toggledNodes[getUniqueId(parent)] = true
        parent = parent.parent
      }
      // change the route and render the corresponding diagram
      this.props.goToFlow(node.data.name)
    }

    this.setState({ toggledNodes, activeNode })
  }

  render() {
    const { dirtyFlows, currentFlow } = this.props
    if (!this.state && currentFlow) {
      this.state = getInitialState(currentFlow)
    }
    const treeData = this.buildTreeData()
    return <Tree data={treeData} dirtyFlows={dirtyFlows} onToggle={this.toggleTreeNode} />
  }
}
