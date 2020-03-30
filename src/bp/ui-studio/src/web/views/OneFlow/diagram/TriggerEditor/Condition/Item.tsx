import { Button, Colors, Position, Tooltip } from '@blueprintjs/core'
import { Condition } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import style from '../style.scss'

interface OwnProps {
  diagramNodeView: boolean
  className: string
  condition: Condition
  onEdit: (condition: Condition) => void
  onDelete: (condition: Condition) => void
}

interface StateProps {
  conditions: Condition[]
}

type Props = StateProps & OwnProps

const ConditionItem: FC<Props> = ({ conditions, condition, onEdit, onDelete, className, diagramNodeView }) => {
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
      description = description.replace(`{${key}}`, condition.params[key] as any)
    })
  }

  if (diagramNodeView) {
    const params = Object.keys(condition.params)
    return (
      <Tooltip
        usePortal={false}
        content={
          !!params.length && (
            <div>
              <strong>Trigger parameters</strong>
              <br />
              {params.map(key => {
                return (
                  <div key={key}>
                    - {key}: {condition.params[key]}
                  </div>
                )
              })}
            </div>
          )
        }
      >
        <li>{description || definition.label}</li>
      </Tooltip>
    )
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
