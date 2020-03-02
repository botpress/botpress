import { Breadcrumbs, Button, ButtonGroup, ControlGroup, Intent } from '@blueprintjs/core'
import { Condition, FlowCondition, FlowTrigger } from 'botpress/sdk'
import { confirmDialog } from 'botpress/shared'
import _ from 'lodash'
import nanoid from 'nanoid/generate'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { updateFlow } from '~/actions'
import { toastSuccess } from '~/components/Shared/Utils/Toaster'
import withLanguage from '~/components/Util/withLanguage'

import style from '../style.scss'

import triggerStyles from './style.scss'
import ConditionDropdown from './Condition/ConditionDropdown'
import ConditionEditor from './Condition/Editor'
import ConditionItem from './Condition/Item'

interface OwnProps {
  goalName: string
  selectedTopic: string
  triggers?: FlowTrigger[]
  closeModal: () => void
}

interface StateProps {
  conditions?: Condition[]
  contentLang: string
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
  const [forceSave, setForceSave] = useState(false)

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

  const onConditionDeleted = async (trigger: FlowTrigger, condition: FlowCondition) => {
    if (await confirmDialog('Are you sure to delete this condition?', { acceptLabel: 'Delete' })) {
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
    setForceSave(true)
    props.updateFlow({ triggers })
    props.closeModal()
    toastSuccess(`Changes saved successfully`)
  }

  if (isEditing) {
    return (
      <div>
        <Breadcrumbs
          items={[{ onClick: () => setEditing(false), text: 'Triggers' }, { text: 'Condition' }]}
          minVisibleItems={3}
        />

        <ConditionEditor
          topicName={props.selectedTopic}
          condition={currentCondition}
          params={currentFlowCondition && currentFlowCondition.params}
          updateParams={onParamsChanged}
          contentLang={props.contentLang}
          forceSave={forceSave}
        />

        <Button text="Save changes" onClick={saveChanges} intent={Intent.PRIMARY} className={style.modalFooter} />
      </div>
    )
  }

  return (
    <div>
      <div className={style.modalHeader}>
        <Breadcrumbs items={[{ onClick: () => setEditing(false), text: 'Triggers' }]} minVisibleItems={3} />
        <Button icon="add" text="Add new trigger" intent="success" onClick={addTrigger} />
      </div>

      {!triggers.length && <p className={style.emptyState}>No triggers</p>}

      {triggers.map((trigger, idx) => {
        return (
          <div className={triggerStyles.triggerWrapper} key={trigger.id}>
            <h5>{idx + 1} - This goal is triggered when a user event match those conditions:</h5>
            {!!trigger.conditions?.length && (
              <div className={triggerStyles.triggerConditionsWrapper}>
                {trigger.conditions.map((condition, index) => (
                  <ConditionItem
                    condition={condition}
                    className={!trigger.conditions[index + 1] && triggerStyles.last}
                    onEdit={flowCondition => onConditionEdit(trigger, flowCondition)}
                    onDelete={flowCondition => onConditionDeleted(trigger, flowCondition)}
                    key={condition.id}
                  />
                ))}
              </div>
            )}

            <ButtonGroup>
              <ConditionDropdown onChange={con => setCurrentCondition(con)} ignored={trigger.conditions} />
              <Button icon="add" minimal text="Add condition" onClick={() => addCondition(trigger, currentCondition)} />
            </ButtonGroup>
          </div>
        )
      })}

      <Button text="Save changes" onClick={saveChanges} intent={Intent.PRIMARY} className={style.modalFooter} />
    </div>
  )
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, { updateFlow })(
  withLanguage(TriggerEditor)
)
