import { Button, ButtonGroup, Intent } from '@blueprintjs/core'
import axios from 'axios'
import { Condition } from 'botpress/sdk'
import { confirmDialog, lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { switchFlowNode, updateFlowNode } from '~/actions'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'

import { FlowView } from '../../../../../../../../../out/bp/common/typings'
import withLanguage from '../../../../components/Util/withLanguage'
import { getCurrentFlow } from '../../../../reducers'
import { TriggerNodeModel } from '../../../FlowBuilder/diagram/nodes_v2/TriggerNode'

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
  currentFlow: FlowView
  backendConditions?: Condition[]
  contentLang: string
}

interface DispatchProps {
  updateFlowNode: any
  switchFlowNode: (nodeId: string) => any
}

type Props = StateProps & DispatchProps & OwnProps

const EditTriggerModal: FC<Props> = props => {
  const [isEditing, setEditing] = useState(false)
  const [conditions, setConditions] = useState<Condition[]>([])
  const [currentFlowCondition, setCurrentFlowCondition] = useState()
  const [currentCondition, setCurrentCondition] = useState<Condition>()
  const [topicName, setTopicName] = useState('')
  const [forceSave, setForceSave] = useState(false)

  useEffect(() => {
    setConditions([])
    setTopicName('')

    if (props.node) {
      const {
        node: { conditions },
        currentFlow
      } = props

      setConditions(conditions)
      setTopicName(currentFlow?.location?.split('/')[0])
    }
  }, [props.node])

  const addCondition = (condition: Condition) => {
    setCurrentCondition(condition)

    const newCondition = { id: condition.id, params: {} } as Condition
    setCurrentFlowCondition(newCondition)
    save([...conditions, newCondition])

    if (condition.params) {
      setEditing(true)
    }
  }

  const onConditionEdit = (condition: Condition) => {
    setCurrentCondition(props.backendConditions.find(x => x.id === condition.id))
    setCurrentFlowCondition(condition)
    setEditing(true)
  }

  const onParamsChanged = (newParams: any) => {
    const selCond = conditions.find(x => x.id === currentFlowCondition.id)

    selCond.params = _.merge(selCond.params, newParams)
    save([...conditions])
  }

  const onConditionDeleted = async (condition: Condition) => {
    if (
      await confirmDialog(lang.tr('studio.flow.condition.confirmDeleteCondition'), { acceptLabel: lang.tr('delete') })
    ) {
      save([...conditions.filter(cond => cond.id !== condition.id)])

      const def = props.backendConditions.find(x => x.id === condition.id)
      if (def.callback) {
        await axios.post(`${window.BOT_API_PATH}/${def.callback}`, { action: 'delete', condition })
      }
    }
  }

  const save = updatedConditions => {
    const { node, switchFlowNode, updateFlowNode } = props

    switchFlowNode?.(node.id)
    updateFlowNode?.({ conditions: updatedConditions })
    setConditions(updatedConditions)
  }

  const close = () => {
    setForceSave(true)
    setImmediate(() => {
      props.toggle()
      setEditing(false)
      setForceSave(false)
    })
  }

  const { isOpen, contentLang, backendConditions } = props

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={close}
      className={triggerStyles.dialog}
      style={{ width: 750, minHeight: 380 }}
      icon="edit"
      title={lang.tr('studio.flow.condition.editTriggers')}
    >
      <DialogBody>
        <div className={cx(triggerStyles.formHeader, { [triggerStyles.editing]: isEditing })}>
          {isEditing && (
            <Button icon="arrow-left" small minimal onClick={() => setEditing(false)}>
              {lang.tr('studio.flow.condition.backToList')}
            </Button>
          )}
          <p className={triggerStyles.tip}>{lang.tr('studio.flow.condition.savedAutomatically')}</p>
        </div>
        {isEditing && (
          <div>
            <ConditionEditor
              condition={currentCondition}
              params={currentFlowCondition && currentFlowCondition.params}
              updateParams={onParamsChanged}
              topicName={topicName}
              contentLang={contentLang}
              forceSave={forceSave}
            />
          </div>
        )}

        {!isEditing && (
          <div>
            {!!conditions.length && (
              <div className={triggerStyles.triggerConditionsWrapper}>
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

            {conditions?.length !== backendConditions?.length && (
              <ButtonGroup>
                <ConditionDropdown onChange={con => setCurrentCondition(con)} ignored={conditions} />
                <Button
                  icon="add"
                  minimal
                  text={lang.tr('studio.flow.condition.addCondition')}
                  onClick={() => addCondition(currentCondition)}
                />
              </ButtonGroup>
            )}
          </div>
        )}
      </DialogBody>
    </BaseDialog>
  )
}

const mapStateToProps = state => ({ backendConditions: state.ndu.conditions, currentFlow: getCurrentFlow(state) })

const mapDispatchToProps = {
  switchFlowNode,
  updateFlowNode
}

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(withLanguage(EditTriggerModal))
