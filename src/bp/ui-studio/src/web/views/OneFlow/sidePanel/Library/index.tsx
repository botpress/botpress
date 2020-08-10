import { Button } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import cx from 'classnames'
import { buildFlowName, parseFlowName } from 'common/flow'
import { FlowView } from 'common/typings'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { createFlow, updateFlow } from '~/actions'
import { getAllFlows, RootReducer } from '~/reducers'

import style from './style.scss'
import LibrarySection, { LibrarySectionItem } from './LibrarySection'
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
  const [expanded, setExpanded] = useState<any>({})

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

  const createFlow = () => {
    const originalName = 'subworkflow'
    let name = undefined
    let fullName = undefined
    let index = 0
    do {
      name = `${originalName}${index ? `-${index}` : ''}`
      fullName = buildFlowName({ topic: '__reusable', workflow: name }, true).workflowPath
      index++
    } while (props.flows.find(f => f.name === fullName))

    console.log(fullName)
    props.createFlow(fullName)
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

  const toggleExpanded = (id: string) => {
    setExpanded({ ...expanded, [id]: !expanded[id] })
  }

  const renderBlocksTable = () => {
    const items = props.flows
      .filter(x => x.type === 'block')
      .map<LibrarySectionItem>(w => ({ title: w.name }))

    return (
      <LibrarySection
        id="blocks"
        title="Saved Blocks"
        items={items}
        getIsExpanded={x => expanded[x]}
        toggleExpanded={toggleExpanded}
      />
    )
  }
  const renderWorflowsTable = () => {
    const items = [
      ...props.flows
        .filter(x => x.type === 'reusable')
        .map<LibrarySectionItem>(w => ({
          title: w.name
        })),
      {
        title: 'Add Workflow',
        action: () => {
          createFlow()
        }
      }
    ]

    return (
      <LibrarySection
        id="workflows"
        title="Saved Workflows"
        items={items}
        getIsExpanded={x => expanded[x]}
        toggleExpanded={toggleExpanded}
      />
    )
  }

  const renderVariableTypes = () => {
    const items = [
      ...entities
        .filter(x => x.type !== 'system')
        .map<LibrarySectionItem>(w => ({ title: w.name, isAdd: false })),
      {
        title: 'Add Enumeration',
        action: async () => {
          await createEntity('list')
        }
      },
      {
        title: 'Add Pattern',
        action: async () => {
          await createEntity('pattern')
        }
      }
    ]

    return (
      <LibrarySection
        id="variables"
        title="Variable Types"
        items={items}
        getIsExpanded={x => expanded[x]}
        toggleExpanded={toggleExpanded}
      />
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
      {renderBlocksTable()}
      {renderWorflowsTable()}
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
