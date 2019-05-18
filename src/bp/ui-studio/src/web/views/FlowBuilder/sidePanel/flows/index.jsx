import React, { Component, Fragment } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

import { Popover, Button, Overlay } from 'react-bootstrap'

import { get, includes } from 'lodash'

import Tree from './tree'
import { buildFlowsTree, getUniqueId, splitFlowPath } from './util'

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
  const { folders, flow } = splitFlowPath(currentFlow.name)

  return {
    toggledNodes: folders.reduce((acc, folder) => {
      acc[getUniqueId(folder)] = true
      return acc
    }, {}),
    activeNode: getUniqueId(flow)
  }
}

export default class FlowsList extends Component {
  menuButtons = {}

  componentDidMount() {
    if(this.props.currentFlow){
      this.initState(this.props.currentFlow)
    }
  }

  componentDidUpdate(nextProps) {
    const { currentFlow } = nextProps
    if(currentFlow && (!this.state.activeNode || this.state.activeNode.split(':')[1] !== currentFlow.name.replace('.flow.json', ''))){
      this.initState(currentFlow)
    }

  }

  initState(currentFlow){
    const state = getInitialState(currentFlow)
    this.setState(state)
  }

  initializeState(props) {
    const { currentFlow } = props

    if (this.state.activeNode === null && currentFlow) {
      const state = getInitialState(currentFlow)
      this.setState(state)
    }
  }

  state = {
    showDropdownIndex: -1,
    toggledNodes: {},
    activeNode: null
  }

  renderMenu = node => {
    if (this.props.readOnly) {
      return null
    }

    const flow = node.data
    const index = node.fullPath.replace(/\//g, '__')

    const hideOverlay = () => {
      this.setState({
        showDropdownIndex: -1
      })
    }

    const handleAction = fn => event => {
      event.stopPropagation()
      hideOverlay()
      setTimeout(fn, 250)
    }

    const handleDelete = handleAction(() => {
      if (confirm(`Are you sure you want to delete the flow ${flow.name}?`) === true) {
        this.props.deleteFlow(flow.name)
      }
    })

    const handleRename = handleAction(() => {

      const name = window.prompt('Please enter the new name for that flow', flow.name.replace(/\.flow\.json$/i, ''))
  
      if (!name) {
        return
      }
  
      if (/[^A-Z0-9-_\/]/i.test(name)) {
        return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
      }
  
      if (name !== flow.name && includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
          return alert(`ERROR: The flow ${name} already exists`)
      }
      
      this.props.renameFlow({targetFlow: flow.name, name : `${name}.flow.json`})
    })

    const handleDuplicate = handleAction(() => {
      let name = prompt('Enter the name of the new flow')

      if (!name) {
        return
      }

      name = name.replace(/\.flow\.json$/i, '')

      if (/[^A-Z0-9-_\/]/i.test(name)) {
        return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
      }

      if (includes(this.props.flows.map(f => f.name), name + '.flow.json')) {
        return alert(`ERROR: The flow ${name} already exists`)
      }

      this.props.duplicateFlow({ flowNameToDuplicate: flow.name, name: `${name}.flow.json` })
    })

    const dropdown = (
      <Popover id={`flow-${index}-dropdown`} bsClass={classnames(style.popover, 'popover')}>
        <ul className={style.menu}>
          {
            flow.name !== 'main.flow.json' && <li onClick={handleDelete}>Delete</li>
          }
          {
            flow.name !== 'main.flow.json' && <li onClick={handleRename}>Rename</li>
          }
          <li onClick={handleDuplicate}>Duplicate</li>
        </ul>
      </Popover>
    )

    const overlayShown = this.state.showDropdownIndex === index

    const showOverlay = event => {
      event.stopPropagation()
      this.setState({
        showDropdownIndex: index
      })
    }

    const refId = 'menu-btn-' + index

    const caret = (
      <Button bsSize="xsmall" ref={node => (this.menuButtons[refId] = node)} onClick={showOverlay}>
        <span className="caret" />
      </Button>
    )

    const overlay = (
      <Overlay
        onHide={hideOverlay}
        show={overlayShown}
        animation={false}
        trigger="click"
        rootClose
        placement="bottom"
        target={() => ReactDOM.findDOMNode(this.menuButtons[refId])}
      >
        {dropdown}
      </Overlay>
    )

    return (
      <Fragment>
        <div className={style.menuButton}>{caret}</div>
        {overlay}
      </Fragment>
    )
  }

  buildTreeData() {
    const { flows } = this.props
    const nodes = buildFlowsTree(flows)
    if (this.state) {
      setNodeStates(nodes, this.state.toggledNodes, this.state.activeNode)
    }
    return nodes
  }

  toggleTreeNode = node => {
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
    const { dirtyFlows } = this.props

    const treeData = this.buildTreeData()
    return (
      <Tree
        data={treeData}
        dirtyFlows={dirtyFlows}
        renderMenu={this.props.readOnly ? null : this.renderMenu}
        onToggle={this.toggleTreeNode}
      />
    )
  }
}
