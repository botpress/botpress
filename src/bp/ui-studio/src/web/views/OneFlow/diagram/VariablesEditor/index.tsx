import { Icon } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { getCurrentFlow, getVariables, RootReducer } from '~/reducers'

import style from './style.scss'
import NoVariableIcon from './NoVariableIcon'

interface OwnProps {
  editVariable: (variable) => void
}
type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const VariablesEditor: FC<Props> = ({ variables, editVariable }) => {
  const currentFlowVars = variables.currentFlow
  if (!currentFlowVars?.length) {
    return <EmptyState icon={<NoVariableIcon />} text={lang.tr('variable.emptyState')} />
  }

  const allTypes = _.sortBy(
    _.uniqWith(
      currentFlowVars.map(x => ({ type: x.type, subType: x.params?.subType })),
      (a, b) => a.type === b.type && a.subType === b.subType
    ),
    'type'
  )

  return (
    <div className={style.wrapper}>
      {allTypes.map(({ type, subType }, i) => {
        const filtered = currentFlowVars.filter(x => x.type === type && x.params?.subType === subType)
        const icon = variables.primitive.find(x => x.id === type)?.config?.icon

        return (
          <div key={`${type}-${subType}`}>
            <div className={style.group}>
              <div className={style.label}>
                {lang.tr(type)} {subType ? `(${subType})` : ''}
              </div>
              <div>
                {filtered.map(item => (
                  <button key={item.params?.name} className={style.button} onClick={() => editVariable(item)}>
                    <Icon icon={icon} /> <span className={style.label}>{item.params?.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {i < allTypes.length - 1 && <div className={style.divider} />}
          </div>
        )
      })}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  variables: getVariables(state)
})

export default connect<StateProps, OwnProps>(mapStateToProps)(VariablesEditor)
