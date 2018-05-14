import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'

// import { ListGroup, ListGroupItem, Popover, Button, MenuItem, Overlay } from 'react-bootstrap'

import get from 'lodash/get'

import Tree from './tree'
import { buildFlowsTree } from './util'

const style = require('./style.scss')

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

  constructor(props) {
    super(props)
    this.state = {
      currentTreeNode: null,
      treeData: this.buildTreeData(props)
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.flows !== this.props.flows || newProps.currentFlow !== this.props.currentFlow) {
      this.setState({
        treeData: this.buildTreeData(newProps)
      })
    }
  }

  buildTreeData(props) {
    const { flows, currentFlow, dirtyFlows } = props
    return buildFlowsTree(flows, { currentFlow })
  }

  toggleTreeNode = (node, toggled) => {
    // NB: we're mutating data here but it seems to be fine according
    // to the official example
    // https://github.com/alexcurtis/react-treebeard#quick-start
    if (node.children) {
      node.toggled = toggled
    }
    if (node.type === 'file') {
      if (this.state.currentTreeNode) {
        this.state.currentTreeNode.active = false
      }
      node.active = true
      this.props.goToFlow(node.data.name)
    }
    this.setState({ currentTreeNode: node })
  }

  render() {
    const { dirtyFlows } = this.props
    const { treeData } = this.state
    return <Tree data={treeData} dirtyFlows={dirtyFlows} onToggle={this.toggleTreeNode} />
  }
}
