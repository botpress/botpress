import { Button, Intent, MenuItem } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { confirmDialog, lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { deleteEntity, refreshEntities, setActiveFormItem } from '~/actions'
import { SearchBar } from '~/components/Shared/Interface'
import { RootReducer } from '~/reducers'

import style from '../TopicList/style.scss'

import TreeItem from './TreeItem'

interface OwnProps {
  readOnly: boolean
  editing: string
  isEditingNew: boolean
  selectedWorkflow: string
  entities: sdk.NLU.EntityDefinition[]
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

const Library: FC<Props> = props => {
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState<NodeData[]>([])
  const [expanded, setExpanded] = useState<any>({})

  useEffect(() => {
    props.refreshEntities()
  }, [])

  useEffect(() => {
    const entities = props.entities
      ?.filter(x => x.type !== 'system' && x.name?.toLowerCase()?.includes(filter.toLowerCase()))
      .map(x => ({
        id: x.id,
        type: 'variableType',
        label: x.name,
        icon: x.type === 'pattern' ? 'comparison' : 'properties'
      }))

    const items = [
      { id: 'block', type: 'block' as NodeType, label: lang.tr('studio.library.savedBlocks'), children: [] },
      {
        id: 'workflow',
        type: 'workflow' as NodeType,
        label: lang.tr('studio.library.savedWorkflows'),
        children: []
      },
      {
        id: 'variableType',
        type: 'variableType' as NodeType,
        label: lang.tr('studio.library.variableTypes'),
        children: entities
      }
    ]

    setItems(items)
  }, [props.entities, filter])

  const handleClick = ({ path, item, level }): void => {
    if (item.children?.length || level === 0) {
      setExpanded({ ...expanded, [path]: !expanded[path] })
    }

    if (item.type === 'variableType' && level !== 0) {
      props.setActiveFormItem({ type: 'variableType', data: props.entities.find(x => x.id === item.id) })
    }
  }

  const newVarType = async (type: 'pattern' | 'list') => {
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

  const handleContextMenu = (element: NodeData) => {
    const { id, type } = element as NodeData

    if (id === type) {
      return
    }

    return (
      <Fragment>
        <MenuItem id="btn-duplicate" label={lang.tr('duplicate')} onClick={() => duplicateVarType(id)} />
        <MenuItem id="btn-delete" label={lang.tr('delete')} intent={Intent.DANGER} onClick={() => deleteEntity(id)} />
      </Fragment>
    )
  }

  const printTree = (item: NodeData, level, parentId = '') => {
    const hasChildren = !!item.children?.length
    const path = `${parentId}${parentId && '/'}${item.id}`
    const isTopLevel = level === 0

    const treeItem = (
      <div className={cx(item.type)} key={path}>
        <TreeItem
          className={cx(style.treeItem, { [style.isTopic]: isTopLevel })}
          isExpanded={expanded[path]}
          item={item}
          level={level}
          contextMenuContent={handleContextMenu(item)}
          onClick={() => handleClick({ item, path, level })}
        />

        {expanded[path] && (
          <Fragment>
            {hasChildren && item.children.map(child => printTree(child, level + 1, path))}

            {item.type === 'workflow' && (
              <Button
                minimal
                onClick={() => props.createWorkflow(item.id)}
                icon="plus"
                className={style.addBtn}
                text={lang.tr('studio.flow.sidePanel.addWorkflow')}
              />
            )}

            {item.type === 'variableType' && (
              <Fragment>
                <Button
                  minimal
                  onClick={async () => await newVarType('list')}
                  icon="plus"
                  className={style.addBtn}
                  text={lang.tr('studio.library.addEnum')}
                />
                <Button
                  minimal
                  onClick={async () => await newVarType('pattern')}
                  icon="plus"
                  className={style.addBtn}
                  text={lang.tr('studio.library.addPattern')}
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
  refreshEntities,
  setActiveFormItem,
  deleteEntity
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Library)
