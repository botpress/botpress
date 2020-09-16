import { Icon } from '@blueprintjs/core'
import { EmptyState, lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { getCurrentFlow, getVariables, RootReducer } from '~/reducers'

import style from './style.scss'
import NoVariableIcon from './NoVariableIcon'

interface OwnProps {
  editVariable: (variable) => void
}
type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const VariablesList: FC<Props> = ({ variables, activeFormItem, editVariable, currentFlow }) => {
  const currentFlowVars = variables.currentFlow
  if (!currentFlowVars?.length) {
    return <EmptyState icon={<NoVariableIcon />} text={lang.tr('variable.emptyState')} />
  }

  const renderTypes = types =>
    types.map(({ type, subType, vars }, i) => {
      const icon = variables.primitive.find(x => x.id === type)?.config?.icon

      return (
        <div className={style.group} key={`${type}-${subType}`}>
          <div className={style.label}>
            {lang.tr(type)} {subType ? `(${subType})` : ''}
          </div>
          <div className={style.variables}>
            {vars.map(item => (
              <button
                key={item.params?.name}
                className={cx(style.button, { [style.active]: activeFormItem?.node?.variable === item })}
                onClick={() => editVariable(item)}
              >
                <Icon icon={icon} iconSize={10} /> <span className={style.label}>{item.params?.name}</span>
              </button>
            ))}
          </div>
        </div>
      )
    })

  if (currentFlow.type === 'reusable') {
    const varList = currentFlowVars.reduce(
      (acc, variable) => {
        let varVisibility = 'private'

        if (variable.params?.isInput) {
          varVisibility = 'input'
        } else if (variable.params?.isOutput) {
          varVisibility = 'output'
        }

        const currentType = acc[varVisibility].types.find(x => x.type === variable.type) || {
          type: variable.type,
          subType: variable.params?.subType,
          vars: []
        }
        currentType.vars.push(variable)
        const leftoverVars = acc[varVisibility].types.filter(x => x.type !== variable.type)

        acc[varVisibility] = { ...acc[varVisibility], types: [...leftoverVars, currentType] }

        return acc
      },
      {
        private: { label: lang.tr('variable.privateVariables'), types: [] },
        input: { label: lang.tr('variable.inputVariables'), types: [] },
        output: { label: lang.tr('variable.outputVariables'), types: [] }
      }
    )

    return (
      <Fragment>
        {Object.keys(varList).map(key => {
          const { types, label } = varList[key]
          return (
            <div className={style.wrapper} key={key}>
              <h1 className={cx({ [style.noMargin]: !types.length })}>{label}</h1>
              {renderTypes(types)}
            </div>
          )
        })}
      </Fragment>
    )
  }

  const typesList = currentFlowVars.reduce((acc, variable) => {
    const currentType = acc.find(x => x.type === variable.type) || {
      type: variable.type,
      subType: variable.params?.subType,
      vars: []
    }
    currentType.vars.push(variable)
    const leftoverVars = acc.filter(x => x.type !== variable.type)

    return [...leftoverVars, currentType]
  }, [])

  return <div className={style.wrapper}>{renderTypes(typesList)}</div>
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  variables: getVariables(state),
  activeFormItem: state.flows.activeFormItem
})

export default connect<StateProps, OwnProps>(mapStateToProps)(VariablesList)
