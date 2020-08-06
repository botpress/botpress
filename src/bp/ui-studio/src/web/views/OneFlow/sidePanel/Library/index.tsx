import { Button } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import cx from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { createFlow, updateFlow } from '~/actions'
import { getAllFlows, RootReducer } from '~/reducers'

import style from './style.scss'
import EntityModal from './Modal'
import EntityNameModal from './NameModal'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
interface OwnProps {
  goToFlow: (flow: any) => void
}

type Props = OwnProps & StateProps & DispatchProps
interface TableItem {
  label: string
  click: () => void
  edit: () => void
  delete: () => void
}

const Library: FC<Props> = props => {
  const [currentEntity, setCurrentEntity] = useState<NLU.EntityDefinition>()
  const [currentNamingEntity, setCurrentNamingEntity] = useState<NLU.EntityDefinition>()
  const [forceUpdate, setForceUpdate] = useState(false)
  const [entities, setEntities] = useState<NLU.EntityDefinition[]>([])

  useEffect(() => {
    async function fetchEntities() {
      const res = await axios.get(`${window.BOT_API_PATH}/nlu/entities`)
      setEntities(res.data)
    }
    // tslint:disable-next-line: no-floating-promises
    fetchEntities()
  }, [forceUpdate])

  const createEntity = async (type: string) => {
    const originalName = `${type}-entity`
    let name
    let index = 0
    do {
      name = `${originalName}${index ? `-${index}` : ''}`
      index++
    } while (entities.find(x => x.name === name))

    const entity = {
      id: name,
      name,
      type,
      occurrences: []
    }

    await axios.post(`${window.BOT_API_PATH}/nlu/entities`, entity)
    setForceUpdate(!forceUpdate)
  }

  const deleteEntity = async (entity: NLU.EntityDefinition) => {
    await axios.post(`${window.BOT_API_PATH}/nlu/entities/${entity.id}/delete`)
    setForceUpdate(!forceUpdate)
  }

  const updateEntity = async (targetEntityId: string, entity: NLU.EntityDefinition) => {
    await axios.post(`${window.BOT_API_PATH}/nlu/entities/${targetEntityId}`, entity)
    const idx = entities.findIndex(ent => ent.name === entity.name)
    setEntities([...entities.slice(0, idx), entity, ...entities.slice(idx + 1)])
  }

  const renderTable = (title: string, items: TableItem[]) => {
    return (
      <table
        className={cx(
          style.table,
          'bp3-html-table bp3-html-table-striped bp3-html-table-bordered .bp3-html-table-condensed'
        )}
      >
        <thead>
          <tr>
            <th>{title}</th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>{renderTableRows(items)}</tbody>
      </table>
    )
  }
  const renderTableRows = (items: TableItem[]) => {
    return (
      <Fragment>
        {items &&
          items?.map((item, i) => (
            <tr key={i}>
              <td>
                <Button text={item.label} onClick={item.click} />
              </td>
              <td>
                <Button icon="edit" onClick={item.edit} />
              </td>
              <td>
                <Button icon="delete" onClick={item.delete} />
              </td>
            </tr>
          ))}
      </Fragment>
    )
  }

  const renderVariableTypes = () => {
    return (
      <section>
        {renderTable(
          'Variable Types',
          entities
            .filter(x => x.type !== 'system')
            .map<TableItem>(x => ({
              label: x.name,
              click: () => {
                setCurrentEntity(x)
              },
              edit: () => {
                setCurrentNamingEntity(x)
              },
              delete: async () => {
                await deleteEntity(x)
              }
            }))
        )}
        <p>
          <Button text="Add Enumeration" onClick={() => createEntity('list')} />
        </p>
        <p>
          <Button text="Add Pattern" onClick={() => createEntity('pattern')} />
        </p>
      </section>
    )
  }

  const renderModal = () => {
    return (
      <EntityModal
        entity={currentEntity}
        entities={entities}
        updateEntity={updateEntity}
        isOpen={currentEntity !== undefined}
        onClose={() => setCurrentEntity(undefined)}
      />
    )
  }
  const renderNameModal = () => {
    return (
      <EntityNameModal
        entity={currentNamingEntity}
        isOpen={currentNamingEntity !== undefined}
        onClose={() => {
          setForceUpdate(!forceUpdate)
          setCurrentNamingEntity(undefined)
        }}
      />
    )
  }

  return (
    <div className={style.library}>
      {renderVariableTypes()}
      {renderModal()}
      {renderNameModal()}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: getAllFlows(state)
})

const mapDispatchToProps = {
  createFlow,
  updateFlow
}

export default connect(mapStateToProps, mapDispatchToProps)(Library)
