import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { getCurrentFlow, getDisplayVariables, RootReducer } from '~/reducers'

import style from './style.scss'
import NoVariableIcon from './NoVariableIcon'

interface OwnProps {
  editVariable: (variable) => void
}
type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const VariablesEditor: FC<Props> = props => {
  const variables = props.currentFlow?.variables

  if (!variables?.length) {
    return (
      <div className={style.emptyState}>
        <EmptyState icon={<NoVariableIcon />} text={lang.tr('variable.emptyState')} />
      </div>
    )
  }

  const subTypes = _.sortBy(
    _.uniqWith(
      variables.map(x => ({ type: x.type, subType: x.params.subType })),
      (a, b) => a.type === b.type && a.subType === b.subType
    ),
    'type'
  )

  return (
    <div className={style.wrapper}>
      {subTypes.map(({ type, subType }) => {
        const filtered = variables.filter(x => x.type === type && x.params.subType === subType)

        return (
          <div key={`${type}-${subType}`}>
            <div className={style.group}>
              <div className={style.label}>
                {lang.tr(type)} {subType ? `(${subType})` : ''}
              </div>
              <div>
                {filtered.map(item => (
                  <button className={style.button} onClick={() => props.editVariable(item)}>
                    <span className={style.label}>{item.params?.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={style.divider} />
          </div>
        )
      })}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  variables: getDisplayVariables(state)
})

export default connect<StateProps, OwnProps>(mapStateToProps)(VariablesEditor)
