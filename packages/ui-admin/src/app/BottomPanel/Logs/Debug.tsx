import { Button, Intent } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import cx from 'classnames'
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

import style from '../style.scss'

interface Props {
  persistChanges?: boolean
  ref?: any
}

interface State {
  nodes: any
  checked: any
  expanded: any
}

export default class Debug extends React.Component<Props, State> {
  state = {
    nodes: undefined,
    checked: [],
    expanded: ['bp']
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
      let directory = node.children?.find((child: any) => child.label === item)
      if (!directory) {
        directory = { label: item, value: path.slice(0, index + 1).join(':') }

        if (!node.children) {
          node.children = []
        }
        node.children.push(directory)
      }
      this.buildNodeRecursive(directory, path, index + 1)
    }
  }

  saveConfiguration = async (persist?: boolean) => {
    const debugScope = this.state.checked?.join(',')
    await api.getSecured().post('/admin/health/debug', { debugScope, persist })

    toast.success(lang.tr('bottomPanel.logs.debug.confUpdated'))
  }

  render() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <div className={cx(style.tabContainer, style.flex)}>
        <div className={style.boxed}>
          <CheckboxTree
            nodes={this.state.nodes || []}
            checked={this.state.checked}
            checkModel={'all'}
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
        </div>

        <div>
          <Button
            id="btn-save"
            onClick={() => this.saveConfiguration()}
            intent={Intent.PRIMARY}
            fill={true}
            icon="tick"
            text={lang.tr('apply')}
          />
          <br></br>
          <Button
            id="btn-save"
            onClick={() => this.saveConfiguration(true)}
            fill={true}
            icon="floppy-disk"
            text={lang.tr('applyPersist')}
          />
        </div>
      </div>
    )
  }
}
