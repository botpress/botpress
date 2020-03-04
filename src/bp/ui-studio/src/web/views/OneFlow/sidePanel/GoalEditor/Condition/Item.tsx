import { Button, Colors } from '@blueprintjs/core'
import { Condition, FlowCondition } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import style from '../style.scss'

interface OwnProps {
  className: string
  condition: FlowCondition
  onEdit: (condition: FlowCondition) => void
  onDelete: (condition: FlowCondition) => void
}

interface StateProps {
  conditions: Condition[]
}

type Props = StateProps & OwnProps

const ConditionItem: FC<Props> = ({ conditions, condition, onEdit, onDelete, className }) => {
  if (!conditions) {
    return null
  }

  const definition = conditions.find(x => x.id === condition.id)
  if (!definition) {
    return null
  }

  let description = _.get(definition, 'description')

  if (description && condition.params) {
    Object.keys(condition.params).forEach(key => {
      description = description.replace(`{${key}}`, condition.params[key])
    })
  }

  return (
    <div className={cx(style.triggerConditionItemWrapper, className)}>
      <p>{description || definition.label}</p>
      <div>
        {definition.params && <Button icon="edit" color={Colors.GRAY3} onClick={() => onEdit(condition)} minimal />}
        <Button icon="trash" intent="danger" onClick={() => onDelete(condition)} minimal />
      </div>
    </div>
  )
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect<StateProps, undefined, OwnProps>(mapStateToProps, undefined)(ConditionItem)
