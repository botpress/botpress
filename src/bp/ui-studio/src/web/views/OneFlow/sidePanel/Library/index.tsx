import { Button, Intent, MenuItem } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { confirmDialog, lang } from 'botpress/shared'
import cx from 'classnames'
import { buildFlowName, parseFlowName } from 'common/flow'
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

import style from '../TopicList/style.scss'

import TreeItem from './TreeItem'

interface OwnProps {
  goToFlow: (flow: any) => void
  readOnly: boolean
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

const getNextName = (originalName: string, list: any[]) => {
  let index = 0
  let name = originalName

  while (list.find(f => f.name === name)) {
    index++
    name = `${originalName}-${index}`
  }
  return name
}

const sanitize = (name: string) => {
  return sanitizeName(name).replace(/\//g, '-')
}

const getVarTypeIcon = type => {
  switch (type) {
    case 'pattern':
      return 'comparison'
    case 'list':
      return 'properties'
    case 'complex':
      return 'list-columns'
  }
}

const Library: FC<Props> = props => {
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState<NodeData[]>([])
  const [expanded, setExpanded] = useState<any>({})
  const [editing, setEditing] = useState('')

  useEffect(() => {
    props.refreshEntities()
  }, [])

  useEffect(() => {
    const entities = props.entities
      ?.filter(x => x.type !== 'system' && x.name?.toLowerCase()?.includes(filter.toLowerCase()))
      .map<NodeData>(x => ({
        id: x.id,
        type: 'variableType',
        label: x.name,
        icon: getVarTypeIcon(x.type)
      }))

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
        type: 'workflow' as NodeType,
        label: lang.tr('studio.library.savedWorkflows'),
        children: reusables
      },
      {
        id: 'variableType',
        type: 'variableType' as NodeType,
        label: lang.tr('studio.library.variableTypes'),
        children: entities
      }
    ]

    setItems(items)
  }, [props.entities, props.flows, filter, props.selectedWorkflow, editing])

  const handleClick = ({ path, item, level }): void => {
    if (item.children?.length || level === 0) {
      setExpanded({ ...expanded, [path]: !expanded[path] })
    }

    if (item.type === 'variableType' && level !== 0) {
      props.setActiveFormItem({ type: 'variableType', data: props.entities.find(x => x.id === item.id) })
    } else if (item.type === 'workflow') {
      props.goToFlow(item.id)
    }
  }

  const newVarType = async (type: 'pattern' | 'list' | 'complex') => {
    const name = getNextName(`${type}-entity`, props.entities)
    await createVarType({ id: name, name, type, occurrences: [] })
  }

  const duplicateVarType = async (entityId: string) => {
    const original = props.entities.find(x => x.id === entityId)
    const name = getNextName(entityId, props.entities)

    await createVarType({ ...original, id: name, name })
  }

  const createVarType = async entity => {
    await axios.post(`${window.BOT_API_PATH}/nlu/entities`, entity)
    props.refreshEntities()
    props.setActiveFormItem({ type: 'variableType', data: entity })
  }

  const deleteEntity = async (entityId: string) => {
    if (await confirmDialog(lang.tr('studio.library.confirmDeleteEntity'), { acceptLabel: lang.tr('delete') })) {
      props.deleteEntity(entityId)
      props.refreshEntities()
    }
  }

  const deleteWorkflow = async (workflow: string) => {
    if (await confirmDialog(lang.tr('studio.flow.topicList.confirmDeleteFlow'), { acceptLabel: lang.tr('delete') })) {
      props.deleteFlow(workflow)
    }
  }

  const nextFlowName = (topic: string, originalName: string): string => {
    let name = undefined
    let fullName = undefined
    let index = 0
    do {
      name = `${originalName}${index ? `-${index}` : ''}`
      fullName = buildFlowName({ topic, workflow: name }, true).workflowPath
      index++
    } while (props.flows.find(f => f.name === fullName))

    return fullName
  }

  const duplicateWorkflow = async (workflow: string) => {
    const parsedName = parseFlowName(workflow)
    const copyName = nextFlowName(parsedName.topic, parsedName.workflow)
    props.duplicateFlow({
      flowNameToDuplicate: workflow,
      name: copyName
    })
  }

  const newFlow = async () => {
    const name = nextFlowName('__reusable', 'subworkflow')
    props.createFlow(name)
  }

  const renameFlow = async (value: string) => {
    const fullName = buildFlowName({ topic: parseFlowName(editing).topic, workflow: sanitize(value) }, true)
      .workflowPath

    if (!props.flows.find(x => x.name === fullName)) {
      props.renameFlow({ targetFlow: editing, name: fullName })
      props.updateFlow({ name: fullName })
    }
  }

  const handleContextMenu = (element: NodeData) => {
    const { id, type } = element as NodeData

    if (id === type) {
      return
    }

    if (type == 'variableType') {
      return (
        <Fragment>
          <MenuItem id="btn-duplicate" label={lang.tr('duplicate')} onClick={() => duplicateVarType(id)} />
          <MenuItem id="btn-delete" label={lang.tr('delete')} intent={Intent.DANGER} onClick={() => deleteEntity(id)} />
        </Fragment>
      )
    } else if (type == 'workflow') {
      return (
        <Fragment>
          <MenuItem id="btn-rename" label={lang.tr('rename')} onClick={() => setEditing(id)} />
          <MenuItem id="btn-duplicate" label={lang.tr('duplicate')} onClick={() => duplicateWorkflow(id)} />
          <MenuItem
            id="btn-delete"
            label={lang.tr('delete')}
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
          isExpanded={expanded[path]}
          item={item}
          level={level}
          isEditing={editing === item.id}
          isEditingNew={false}
          contextMenuContent={handleContextMenu(item)}
          onClick={() => handleClick({ item, path, level })}
          onSave={value => renameFlow(value)}
        />

        {expanded[path] && (
          <Fragment>
            {hasChildren && item.children.map(child => printTree(child, level + 1, path))}

            {item.type === 'workflow' && (
              <Button
                minimal
                onClick={() => newFlow()}
                icon="plus"
                className={style.addBtn}
                text={lang.tr('studio.flow.sidePanel.addWorkflow')}
              />
            )}

            {item.type === 'variableType' && (
              <Fragment>
                <Button
                  minimal
                  onClick={async () => newVarType('list')}
                  icon="plus"
                  className={style.addBtn}
                  text={lang.tr('studio.library.addEnum')}
                />
                <Button
                  minimal
                  onClick={async () => newVarType('pattern')}
                  icon="plus"
                  className={style.addBtn}
                  text={lang.tr('studio.library.addPattern')}
                />
                <Button
                  minimal
                  onClick={async () => newVarType('complex')}
                  icon="plus"
                  className={style.addBtn}
                  text={lang.tr('studio.library.addComplex')}
                />
              </Fragment>
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
        className={style.searchBar}
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
