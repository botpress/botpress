import { Button, Colors } from '@blueprintjs/core'
import { Condition, FlowCondition } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

interface OwnProps {
  condition: FlowCondition
  onEdit: (condition: FlowCondition) => void
  onDelete: (condition: FlowCondition) => void
}

interface StateProps {
  conditions: Condition[]
}

type Props = StateProps & OwnProps

const ConditionItem: FC<Props> = ({ conditions, condition, onEdit, onDelete }) => {
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
    <div>
      <Button
        icon="edit"
        color={Colors.GRAY3}
        onClick={() => onEdit(condition)}
        minimal={true}
        disabled={!definition.params}
      />
      <Button icon="remove" color={Colors.GRAY3} onClick={() => onDelete(condition)} minimal={true} />
      {description || definition.label}
    </div>
  )
}

const mapStateToProps = state => ({ conditions: state.ndu.conditions })

export default connect<StateProps, undefined, OwnProps>(
  mapStateToProps,
  undefined
)(ConditionItem)
