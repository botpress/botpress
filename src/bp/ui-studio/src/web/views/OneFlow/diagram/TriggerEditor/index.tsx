import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import { Condition, FlowCondition } from 'botpress/sdk'
import { confirmDialog } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'

import { toastSuccess } from '../../../../components/Shared/Utils'
import withLanguage from '../../../../components/Util/withLanguage'
import { TriggerNodeModel } from '../../../FlowBuilder/diagram/nodes_v2/TriggerNode'
import style from '../../sidePanel/style.scss'

import triggerStyles from './style.scss'
import ConditionDropdown from './Condition/ConditionDropdown'
import ConditionEditor from './Condition/Editor'
import ConditionItem from './Condition/Item'

interface OwnProps {
  node: TriggerNodeModel
  isOpen: boolean
  diagramEngine: any
  readOnly?: boolean
  toggle: () => void
}

interface StateProps {
  contentLang: string
}

type Props = StateProps & OwnProps

const EditGoalModal: FC<Props> = props => {
  const [isEditing, setEditing] = useState(false)
  const [conditions, setConditions] = useState<Condition[]>([])
  const [currentFlowCondition, setCurrentFlowCondition] = useState()
  const [currentCondition, setCurrentCondition] = useState<Condition>()

  const [forceSave, setForceSave] = useState(false)

  useEffect(() => {
    if (props.node) {
      const { conditions } = props.node

      setConditions(conditions)
    }
  }, [props.node])

  const addCondition = (condition: Condition) => {
    setCurrentCondition(condition)

    const newCondition = { id: condition.id, params: {} } as Condition
    setConditions([...conditions, newCondition])
    setCurrentFlowCondition(newCondition)

    if (condition.params) {
      setEditing(true)
    }
  }

  const onConditionEdit = (condition: FlowCondition) => {
    setCurrentCondition(conditions.find(x => x.id === condition.id))
    console.log(condition)
    setCurrentFlowCondition(condition)
    setEditing(true)
  }

  const onParamsChanged = (newParams: any) => {
    const selCond = conditions.find(x => x.id === currentFlowCondition.id)

    selCond.params = _.merge(selCond.params, newParams)
    setConditions([...conditions])
  }

  const onConditionDeleted = async ({ id }: Condition) => {
    if (await confirmDialog('Are you sure to delete this condition?', { acceptLabel: 'Delete' })) {
      setConditions([...conditions.filter(condition => condition.id !== id)])
    }
  }

  const submit = currentItem => {
    // TODO: Update
    const { node, toggle, diagramEngine } = props
    const flowBuilder = diagramEngine.flowBuilder.props

    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ onEnter: [`say #!${currentItem.id}`], conditions })
    toggle()
    toastSuccess(`Changes saved successfully`)
  }

  return (
    <BaseDialog
      isOpen={props.isOpen}
      onClose={props.toggle}
      style={{ width: 900, minHeight: 450 }}
      icon="edit"
      title={`Edit Trigger`}
    >
      <DialogBody>
        {isEditing && (
          <div>
            <ConditionEditor
              condition={currentCondition}
              contentLang={props.contentLang}
              forceSave={forceSave}
              params={currentFlowCondition && currentFlowCondition.params}
              updateParams={onParamsChanged}
            />

            <Button text="Save changes" onClick={submit} intent={Intent.PRIMARY} className={style.modalFooter} />
          </div>
        )}

        {!isEditing && (
          <div>
            {!!conditions.length && (
              <div className={triggerStyles.triggerWrapper}>
                {conditions.map((condition, index) => (
                  <ConditionItem
                    condition={condition}
                    className={!conditions[index + 1] && triggerStyles.last}
                    onEdit={flowCondition => onConditionEdit(flowCondition)}
                    onDelete={flowCondition => onConditionDeleted(flowCondition)}
                    key={condition.id}
                  />
                ))}
              </div>
            )}

            <ButtonGroup>
              <ConditionDropdown onChange={con => setCurrentCondition(con)} ignored={conditions} />
              <Button icon="add" minimal text="Add condition" onClick={() => addCondition(currentCondition)} />
            </ButtonGroup>

            <Button text="Save changes" onClick={submit} intent={Intent.PRIMARY} className={style.modalFooter} />
          </div>
        )}
      </DialogBody>
    </BaseDialog>
  )
}

export default withLanguage(EditGoalModal)
