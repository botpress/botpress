import { Button, Intent, MenuItem } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { confirmDialog, lang, sharedStyle } from 'botpress/shared'
import cx from 'classnames'
import { buildFlowName, nextFlowName, parseFlowName } from 'common/flow'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {
  createFlow,
  deleteEntity,
  deleteFlow,
  duplicateFlow,
  refreshEntities,
  renameFlow,
  setActiveFormItem,
  updateFlow
} from '~/actions'
import { SearchBar } from '~/components/Shared/Interface'
import { RootReducer } from '~/reducers'
import { sanitizeName } from '~/util'
import storage from '~/util/storage'

import style from '../TopicList/style.scss'

import TreeItem from './TreeItem'

const LIBRARY_EXPANDED_KEY = `bp::${window.BOT_ID}::libraryExpanded`

interface OwnProps {
  goToFlow: (flow: any) => void
  readOnly: boolean
  canAdd: boolean
  editing: string
  isEditingNew: boolean
  selectedWorkflow: string
  flows: FlowView[]
  createWorkflow: (topicId: string) => void
  refreshEntities: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = StateProps & DispatchProps & OwnProps

export interface NodeData {
  id: string
  name?: string
  type?: NodeType
  label?: string
  icon?: string
  children?: any[]
}

type NodeType = 'workflow' | 'block' | 'variableType'

const sanitize = (name: string) => {
  return sanitizeName(name).replace(/\//g, '-')
}

const Library: FC<Props> = props => {
  let initialExpanded
  try {
    initialExpanded = JSON.parse(storage.get(LIBRARY_EXPANDED_KEY)) || { variableType: true, workflow: true }
  } catch (error) {
    initialExpanded = {}
  }
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState<NodeData[]>([])
  const [expanded, setExpanded] = useState<any>(initialExpanded)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    props.refreshEntities()
  }, [])

  useEffect(() => {
    try {
      storage.set(LIBRARY_EXPANDED_KEY, JSON.stringify(expanded))
    } catch (error) {
      storage.del(LIBRARY_EXPANDED_KEY)
    }
  }, [expanded])

  useEffect(() => {
    const reusables = props.flows
      .filter(x => x.type === 'reusable' && x.name?.toLowerCase()?.includes(filter.toLowerCase()))
      .map<NodeData>(x => ({
        id: x.name,
        type: 'workflow',
        label: parseFlowName(x.name).workflow,
        icon: 'data-lineage'
      }))

    const items = [
      // { id: 'block', type: 'block' as NodeType, label: lang.tr('studio.library.savedBlocks'), children: [] },
      {
        id: 'workflow',
        type: 'workflowGroup' as NodeType,
        label: lang.tr('studio.library.savedWorkflows'),
        children: reusables
      }
    ]

    setItems(items)
  }, [props.entities, props.flows, filter, props.selectedWorkflow, editing])

  const handleClick = ({ path, item, level }): void => {
    if (item.children?.length || level === 0) {
      setExpanded({ ...expanded, [path]: !expanded[path] })
    }

    if (level === 0) {
      return
    }

    if (item.type === 'variableType') {
      props.setActiveFormItem({ type: 'variableType', data: props.entities.find(x => x.id === item.id) })
    } else if (item.type === 'workflow') {
      props.goToFlow(item.id)
    }
  }

  const createVarType = async entity => {
    await axios.post(`${window.BOT_API_PATH}/nlu/entities`, entity)
    props.refreshEntities()
  }

  const deleteWorkflow = async (workflow: string) => {
    const instances = {}
    props.flows.forEach(flow => {
      flow.nodes.filter(node => {
        if (node.flow === workflow) {
          if (instances[flow.name]) {
            instances[flow.name].nodes.push(node)
          } else {
            instances[flow.name] = { ...parseFlowName(flow.name), nodes: [node] }
          }
        }
      })
    })

    if (
      !Object.keys(instances).length &&
      (await confirmDialog(lang.tr('studio.flow.topicList.confirmDeleteFlow'), { acceptLabel: lang.tr('delete') }))
    ) {
      props.deleteFlow(workflow)
    } else {
      await confirmDialog(lang.tr('studio.flow.topicList.beforeRemovingSubflow'), {
        acceptLabel: lang.tr('ok'),
        showDecline: false,
        body: (
          <ul className={style.confirmBody}>
            {Object.keys(instances).map(key =>
              instances[key].nodes.map(node => {
                const nodeFlow = parseFlowName(node.flow).workflow
                const flow = parseFlowName(key)
                const baseUrl = `/studio/${window.BOT_ID}/oneflow/${flow.workflowPath}`

                return (
                  <li key={`${key}-${node.name}`}>
                    <a href={`${baseUrl}?highlightedNode=${node.id}`} target="_blank">
                      {nodeFlow}
                    </a>{' '}
                    in{' '}
                    <a href={baseUrl} target="_blank">
                      {flow.workflow}
                    </a>
                  </li>
                )
              })
            )}
          </ul>
        )
      })
    }
  }

  const duplicateWorkflow = async (workflow: string) => {
    const parsedName = parseFlowName(workflow)
    const copyName = nextFlowName(props.flows, parsedName.topic, parsedName.workflow)
    props.duplicateFlow({
      flowNameToDuplicate: workflow,
      name: copyName
    })
  }

  const newFlow = async () => {
    const name = nextFlowName(props.flows, '__reusable', 'subworkflow')
    props.createFlow(name)
    setEditing({ type: 'flow', id: name, new: true })
  }

  const renameFlow = async (value: string) => {
    const currentFlow = props.flows.find(x => x.name === editing?.id)
    const fullName = buildFlowName({ topic: parseFlowName(editing?.id).topic, workflow: sanitize(value) }, true)
      .workflowPath
    const flowExists = props.flows.find(x => x.name === fullName)

    if (currentFlow.name !== value && !flowExists) {
      props.renameFlow({ targetFlow: editing?.id, name: fullName })
      props.updateFlow({ name: fullName })
    } else {
      setEditing(null)
    }
  }

  const renameVariableType = async (name: string) => {
    const entity = props.entities.find(x => x.id === editing.id)
    const varTypeExists = props.entities.find(x => x.name === name)

    if (name && !varTypeExists) {
      await axios.post(`${window.BOT_API_PATH}/nlu/entities/${entity.name}`, { ...entity, name, id: name })
      props.refreshEntities()
    }
    setEditing(null)
  }

  const handleContextMenu = (element: NodeData) => {
    const { id, label, type } = element as NodeData

    if (id === type) {
      return
    }

    if (type == 'workflow') {
      return (
        <Fragment>
          <MenuItem
            id="btn-rename"
            label={lang.tr('renameWorkflow')}
            onClick={() => setEditing({ id, type: 'flow' })}
          />
          <MenuItem
            id="btn-duplicate"
            label={lang.tr('studio.library.duplicateWorkflow')}
            onClick={() => duplicateWorkflow(id)}
          />
          <MenuItem
            id="btn-delete"
            label={lang.tr('deleteWorkflow')}
            intent={Intent.DANGER}
            onClick={() => deleteWorkflow(id)}
          />
        </Fragment>
      )
    }
  }

  const printTree = (item: NodeData, level, parentId = '') => {
    const hasChildren = !!item.children?.length
    const path = `${parentId}${parentId && '/'}${item.id}`

    const isTopLevel = level === 0
    const isSelected = item.label === props.selectedWorkflow
    const treeItem = (
      <div
        className={cx(item.type, { [style.larger]: parentId === 'workflow', [style.largerSelected]: isSelected })}
        key={path}
      >
        <TreeItem
          className={cx(style.treeItem, {
            [style.isTopic]: isTopLevel,
            [style.active]: isSelected
          })}
          canDrag={!isSelected}
          isExpanded={expanded[path]}
          item={item}
          level={level}
          isEditing={editing?.id === item.id}
          isEditingNew={editing?.new}
          contextMenuContent={handleContextMenu(item)}
          onClick={() => handleClick({ item, path, level })}
          onSave={value => (editing?.type === 'flow' ? renameFlow(value) : renameVariableType(value))}
        />

        {expanded[path] && (
          <Fragment>
            {hasChildren && item.children.map(child => printTree(child, level + 1, path))}

            {props.canAdd && item.id === 'workflow' && (
              <Button
                minimal
                onClick={() => newFlow()}
                icon="plus"
                className={style.addBtn}
                text={lang.tr('studio.flow.sidePanel.addWorkflow')}
              />
            )}
          </Fragment>
        )}
      </div>
    )

    return treeItem
  }

  return (
    <div className={cx(style.tree)}>
      <SearchBar
        className={sharedStyle.searchBar}
        placeholder={lang.tr('Filter blocks, workflows and variables')}
        onChange={setFilter}
      />
      {items.map(item => printTree(item, 0))}
      <div />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({ entities: state.nlu.entities })

const mapDispatchToProps = {
  duplicateFlow,
  createFlow,
  refreshEntities,
  setActiveFormItem,
  deleteEntity,
  deleteFlow,
  updateFlow,
  renameFlow
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Library)
