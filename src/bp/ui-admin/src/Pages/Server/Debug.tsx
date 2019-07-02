import { Button, Checkbox, Intent, Tooltip } from '@blueprintjs/core'
import React from 'react'
import CheckboxTree from 'react-checkbox-tree'
import 'react-checkbox-tree/lib/react-checkbox-tree.css'
import {
  FaCheckSquare,
  FaChevronDown,
  FaChevronRight,
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaMinusSquare,
  FaPlusSquare,
  FaSquare
} from 'react-icons/fa'

import api from '../../api'
import { AppToaster } from '../../utils/toaster'
import SectionLayout from '../Layouts/Section'

export default class Debug extends React.Component<Props, State> {
  state = {
    nodes: undefined,
    checked: [],
    expanded: ['bp'],
    persist: false
  }

  async componentDidMount() {
    await this.loadConfiguration()
  }

  loadConfiguration = async () => {
    const { data } = await api.getSecured().get(`/admin/server/debug`)
    const rootNode = { label: 'bp', children: [], expandDisabled: true }

    for (const element of Object.keys(data).sort()) {
      this.buildNodeRecursive(rootNode, element.split(':'), 0)
    }

    this.setState({ nodes: rootNode.children, checked: Object.keys(data).filter(x => data[x]) })
  }

  buildNodeRecursive(node: any, path: string[], index: number) {
    if (index < path.length) {
      const item = path[index]
      let directory = node.children.find((child: any) => child.label === item)
      if (!directory) {
        directory = { label: item, value: path.slice(0, index + 1).join(':'), children: [] }
        node.children.push(directory)
      }
      this.buildNodeRecursive(directory, path, index + 1)
    }
  }

  saveConfiguration = async () => {
    const debugScope = this.state.checked && this.state.checked.join(',')
    await api.getSecured().post(`/admin/server/debug`, { debugScope, persist: this.state.persist })

    AppToaster.show({ message: 'Debug configuration updated successfully!', intent: Intent.SUCCESS, timeout: 2000 })
  }

  handlePersistChanged = (e: any) => this.setState({ persist: e.target.checked })

  renderTree() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <CheckboxTree
        nodes={this.state.nodes || []}
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

  renderSide() {
    return (
      <div>
        <Button onClick={this.loadConfiguration} fill={true} icon="refresh" text="Refresh" />
        <br />
        <br />
        <Tooltip content="When checked, the selected debug options will be enabled after each server restart">
          <Checkbox checked={this.state.persist} onChange={this.handlePersistChanged} label="Persist" />
        </Tooltip>

        <Button onClick={this.saveConfiguration} intent={Intent.PRIMARY} fill={true} icon="floppy-disk" text="Save" />
      </div>
    )
  }

  render() {
    return (
      <SectionLayout
        title={`Configure Debug`}
        helpText="This page allows you to enable or disable some debug scopes while using Botpress. This list is populated while features are being used, so some items may be missing"
        activePage="bots"
        mainContent={this.renderTree()}
        sideMenu={this.renderSide()}
      />
    )
  }
}

interface Props {}

interface State {
  nodes: any
  checked: any
  expanded: any
  persist: boolean
}
