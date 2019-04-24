import React from 'react'
import { Container, Button, Alert } from 'reactstrap'
import CheckboxTree from 'react-checkbox-tree'
import {
  FaCheckSquare,
  FaSquare,
  FaChevronRight,
  FaChevronDown,
  FaPlusSquare,
  FaMinusSquare,
  FaFolder,
  FaFolderOpen,
  FaFile
} from 'react-icons/lib/fa'
import { MdRefresh, MdSave } from 'react-icons/lib/md'
import 'react-checkbox-tree/lib/react-checkbox-tree.css'
import api from '../../api'

export default class Debug extends React.Component {
  state = { nodes: undefined, checked: [], expanded: ['bp'] }

  componentDidMount() {
    this.loadConfiguration()
  }

  loadConfiguration = async () => {
    const { data } = await api.getSecured().get(`/admin/server/debug`)
    const rootNode = { label: 'bp', children: [], expandDisabled: true }

    for (const element of Object.keys(data).sort()) {
      this.buildNodeRecursive(rootNode, element.split(':'), 0)
    }

    this.setState({ nodes: rootNode.children, checked: Object.keys(data).filter(x => data[x]) })
  }

  buildNodeRecursive(node, path, index) {
    if (index < path.length) {
      let item = path[index]
      let directory = node.children.find(child => child.label === item)
      if (!directory) {
        directory = { label: item, value: path.slice(0, index + 1).join(':'), children: [] }
        node.children.push(directory)
      }
      this.buildNodeRecursive(directory, path, index + 1)
    }
  }

  saveConfiguration = async () => {
    const debugScope = this.state.checked && this.state.checked.join(',')
    await api.getSecured().post(`/admin/server/debug`, { debugScope })

    this.setState({ successMsg: `Debug scope updated successfully` })

    window.setTimeout(() => {
      this.setState({ successMsg: undefined })
    }, 2000)
  }

  renderTree() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <CheckboxTree
        nodes={this.state.nodes}
        checked={this.state.checked}
        expanded={this.state.expanded}
        onCheck={checked => this.setState({ checked })}
        onExpand={expanded => this.setState({ expanded: ['bp', ...expanded] })}
        showExpandAll={true}
        icons={{
          check: <FaCheckSquare />,
          uncheck: <FaSquare />,
          halfCheck: <FaCheckSquare fillOpacity="0.5" />,
          expandClose: <FaChevronRight />,
          expandOpen: <FaChevronDown />,
          expandAll: <FaPlusSquare />,
          collapseAll: <FaMinusSquare />,
          parentClose: <FaFolder stroke="blue" fill="none" />,
          parentOpen: <FaFolderOpen stroke="blue" fill="none" />,
          leaf: <FaFile stroke="blue" fill="none" />
        }}
      />
    )
  }

  render() {
    return (
      <Container style={{ marginTop: 50, border: '1px solid #dfdfdf', padding: 20 }}>
        {this.state.successMsg && <Alert type="success">{this.state.successMsg}</Alert>}
        <h3>
          Debugging{' '}
          <Button size="sm" onClick={this.loadConfiguration}>
            <MdRefresh />
          </Button>
        </h3>
        <div style={{ padding: 20 }}>{this.renderTree()}</div>
        <Button color="primary" onClick={this.saveConfiguration}>
          Save <MdSave />
        </Button>
      </Container>
    )
  }
}
