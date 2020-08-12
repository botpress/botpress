import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { getCurrentFlow, RootReducer } from '~/reducers'

import style from './style.scss'
import NoVariableIcon from './NoVariableIcon'

interface OwnProps {
  editVariable: (variable) => void
}
type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const VariablesEditor: FC<Props> = props => {
  const variables = props.currentFlow?.variables
  const grouped = _.groupBy(variables, 'type')

  if (!variables?.length) {
    return (
      <div className={style.emptyState}>
        <EmptyState icon={<NoVariableIcon />} text={lang.tr('variable.emptyState')} />
      </div>
    )
  }

  return (
    <div className={style.wrapper}>
      {Object.keys(grouped).map(group => {
        return (
          <div>
            <div className={style.group}>
              <div className={style.label}>{group}</div>
              <div>
                {grouped[group]?.map(item => (
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

const mapStateToProps = (state: RootReducer) => ({ currentFlow: getCurrentFlow(state) })

export default connect<StateProps, OwnProps>(mapStateToProps)(VariablesEditor)
