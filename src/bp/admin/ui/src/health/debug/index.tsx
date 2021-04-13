import { Button, Checkbox, Intent, Tooltip } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
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
import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'

interface State {
  nodes: any
  checked: any
  expanded: any
  persist: boolean
}

export default class Debug extends React.Component<{}, State> {
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
    const { data } = await api.getSecured().get('/admin/health/debug')
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
    await api.getSecured().post('/admin/health/debug', { debugScope, persist: this.state.persist })

    toast.success(lang.tr('admin.debug.confUpdated'))
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
        <Button
          id="btn-refresh"
          onClick={this.loadConfiguration}
          fill={true}
          icon="refresh"
          text={lang.tr('refresh')}
        />
        <br />
        <br />
        <Tooltip content={lang.tr('admin.debug.persistChecked')}>
          <Checkbox
            id="chk-persist"
            checked={this.state.persist}
            onChange={this.handlePersistChanged}
            label={lang.tr('admin.debug.persist')}
          />
        </Tooltip>

        <Button
          id="btn-save"
          onClick={this.saveConfiguration}
          intent={Intent.PRIMARY}
          fill={true}
          icon="floppy-disk"
          text={lang.tr('save')}
        />
      </div>
    )
  }

  render() {
    return (
      <PageContainer
        title={lang.tr('admin.debug.configureDebug')}
        helpText={lang.tr('admin.debug.helpText')}
        superAdmin={true}
      >
        <SplitPage sideMenu={this.renderSide()}>{this.renderTree()}</SplitPage>
      </PageContainer>
    )
  }
}
