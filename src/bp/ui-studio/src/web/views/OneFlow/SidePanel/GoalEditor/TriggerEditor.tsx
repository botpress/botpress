import { Breadcrumbs, Button, ButtonGroup, ControlGroup, Intent } from '@blueprintjs/core'
import { Condition, FlowCondition, FlowTrigger } from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { updateFlow } from '~/actions'
import { toastSuccess } from '~/components/Shared/Utils/Toaster'

import style from '../style.scss'

import ConditionDropdown from './Condition/ConditionDropdown'
import ConditionEditor from './Condition/Editor'
import ConditionItem from './Condition/Item'

interface OwnProps {
  goalName: string
  triggers?: FlowTrigger[]
}

interface StateProps {
  conditions?: Condition[]
}

interface DispatchProps {
  updateFlow: (params: any) => void
}

type Props = StateProps & DispatchProps & OwnProps

const TriggerEditor: FC<Props> = props => {
  const [isEditing, setEditing] = useState(false)
  const [triggers, setTriggers] = useState<FlowTrigger[]>([])

  const [currentTrigger, setCurrentTrigger] = useState<FlowTrigger>()
  const [currentCondition, setCurrentCondition] = useState<Condition>()
  const [currentFlowCondition, setCurrentFlowCondition] = useState()

  useEffect(() => {
    setTriggers(props.triggers || [createEmptyTrigger()])
  }, [props.goalName])

  const getNewId = () => `trigger-${nanoid('abcdefghijklmnopqrstuvwxyz0123456789', 7)}`

  const createEmptyTrigger = () => ({
    id: getNewId(),
    type: 'user-event' as any,
    conditions: []
  })

  const addTrigger = () => {
    setTriggers([...(triggers || []), { id: getNewId(), type: 'user-event', conditions: [] }])
  }

  const addCondition = (trigger: FlowTrigger, condition: Condition) => {
    setCurrentCondition(condition)
    setCurrentTrigger(trigger)

    const trig = triggers.find(x => x.id === trigger.id)
    if (trig) {
      const newCondition = { id: condition.id, params: {} }
      trig.conditions = [...trig.conditions, newCondition]

      setCurrentFlowCondition(newCondition)
    }

    if (condition.params) {
      setEditing(true)
    }
  }

  const onConditionEdit = (trigger: FlowTrigger, condition: FlowCondition) => {
    setCurrentCondition(props.conditions.find(x => x.id === condition.id))
    setCurrentFlowCondition(condition)
    setCurrentTrigger(trigger)

    setEditing(true)
  }

  const onConditionDeleted = (trigger: FlowTrigger, condition: FlowCondition) => {
    if (confirm('Are you sure to delete this condition ?')) {
      const selected = triggers.find(x => x === trigger)
      if (selected) {
        selected.conditions = _.without(selected.conditions, condition)
        setTriggers([...triggers])
      }
    }
  }

  const onParamsChanged = (newParams: any) => {
    const selected = triggers.find(x => x === currentTrigger)
    if (selected) {
      const selCond = selected.conditions.find(x => x.id === currentFlowCondition.id)

      selCond.params = _.merge(selCond.params, newParams)
      setTriggers([...triggers])
    }
  }

  const saveChanges = () => {
    props.updateFlow({ triggers })
    toastSuccess(`Changes saved successfully`)
  }

  if (isEditing) {
    return (
      <div>
        <Breadcrumbs
          items={[
            { onClick: () => setEditing(false), icon: 'folder-close', text: 'Triggers' },
            { icon: 'folder-close', text: 'Condition' }
          ]}
          minVisibleItems={3}
        />

        <ConditionEditor
          topicName="HR"
          condition={currentCondition}
          params={currentFlowCondition && currentFlowCondition.params}
          updateParams={onParamsChanged}
        />

        <Button text="Save changes" onClick={saveChanges} intent={Intent.PRIMARY} className={style.modalFooter} />
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs
        items={[{ onClick: () => setEditing(false), icon: 'folder-close', text: 'Triggers' }]}
        minVisibleItems={3}
      />

      <br />

      {triggers.map((trigger, idx) => {
        return (
          <div key={trigger.id}>
            <h5>#{idx + 1} - This goal is triggered when a user event match those conditions:</h5>
            <div style={{ border: '1px solid lightgray', borderRadius: 10, padding: 3 }}>
              {(trigger.conditions || []).map(condition => (
                <ConditionItem
                  condition={condition}
                  onEdit={flowCondition => onConditionEdit(trigger, flowCondition)}
                  onDelete={flowCondition => onConditionDeleted(trigger, flowCondition)}
                  key={condition.id}
                />
              ))}

              <ButtonGroup>
                <ConditionDropdown onChange={con => setCurrentCondition(con)} ignored={trigger.conditions} />
                <Button
                  icon="add"
                  minimal={true}
                  text="Add condition"
                  onClick={() => addCondition(trigger, currentCondition)}
                />
              </ButtonGroup>
            </div>
          </div>
        )
      })}

      <div style={{ paddingTop: 30 }}>
        <ControlGroup>
          <Button icon="add" text="Add new trigger" minimal={true} onClick={addTrigger} />
        </ControlGroup>
      </div>

      <Button text="Save changes" onClick={saveChanges} intent={Intent.PRIMARY} className={style.modalFooter} />
    </div>
  )
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  { updateFlow }
)(TriggerEditor)
