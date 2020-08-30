import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable, FlowVariableConfig, FlowVariableOperator, FormField, NodeTransition, Option } from 'botpress/sdk'
import { Contents, FormFields, lang, MoreOptions, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from '../PromptForm/style.scss'

import { Operation } from './Operation'
import { OperationParser } from './OperationParser'
import { serializeOperation } from './OperationSerializer'

interface Props {
  deleteTransition: () => void
  close: () => void
  variables: Variables
  transition: NodeTransition
  contentLang: string
  onUpdateVariables: (variable: FlowVariable) => void
  customKey: string
  updateRouter: (transition: NodeTransition) => void
}

type OperationInfo = {
  currentVarType: string
  varConfig: FlowVariableConfig
  operators: Option[]
  operator: FlowVariableOperator
  args: { [key: string]: any }
}

const parseCondition = (condition: string): Operation => {
  if (!condition?.length) {
    return { args: [] } as Operation
  }

  const parser = new OperationParser()
  try {
    return parser.parse(condition)
  } catch {
    return { args: [], operator: '', variable: '', negate: false } as Operation
  }
}

const RouterForm: FC<Props> = ({
  close,
  deleteTransition,
  variables,
  transition,
  contentLang,
  onUpdateVariables,
  customKey,
  updateRouter
}) => {
  const currentVarName = useRef<string>()

  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  const currentItem = parseCondition(transition.condition)

  useEffect(() => {
    setForceUpdate(!forceUpdate)
  }, [customKey, transition, currentVarName.current, currentItem.operator])

  useEffect(() => {
    currentVarName.current = currentItem.variable
  }, [customKey])

  const getOperationInfo = (operation: Operation): OperationInfo => {
    const currentVarType = variables.currentFlow?.find(x => x.params.name === operation.variable)?.type
    const varConfig = variables.primitive.find(x => x.id === currentVarType)?.config
    const operators = varConfig?.operators?.map(x => ({ label: lang.tr(x.label), value: x.func }))
    const operator = varConfig?.operators?.find(x => x.func === operation.operator)

    const args: { [key: string]: string } = {}
    if (operator) {
      const fields = [...operator.fields, ...operator.advancedSettings]
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        args[field.key] = operation.args[i]
      }
    }

    return { currentVarType, varConfig, operators, operator, args }
  }

  const opInfo = getOperationInfo(currentItem)

  const convertToTransition = (opInfo: OperationInfo, operation: Operation): NodeTransition => {
    if (!opInfo.operator) {
      return { condition: '', node: transition.node }
    }

    const friendlyArgs = _.mapValues(opInfo.args, value => {
      return typeof value === 'string' && value.startsWith('$') ? value.substr(1, value.length - 1) : value || ''
    })

    const caption = lang.tr(`${opInfo.operator.caption}${operation.negate ? 'Not' : ''}`, {
      var: operation.variable,
      op: lang.tr(opInfo.operator.label).toLowerCase(),
      ...friendlyArgs
    })

    const condition = serializeOperation(operation)

    return { condition, caption, node: transition.node }
  }

  const onUpdate = data => {
    const operation: Operation = {
      variable: data.variable,
      operator: data.operator,
      negate: data.negate,
      args: []
    }

    let opInfo = getOperationInfo(operation)

    const args = []
    if (opInfo.operator) {
      const fields = [...opInfo.operator.fields, ...opInfo.operator.advancedSettings]
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i]
        args.push(data[field.key] || '')
      }
    }

    operation.args = args
    opInfo = getOperationInfo(operation)

    if (operation.variable && !opInfo.operator) {
      operation.operator = opInfo.operators?.[0].value
      opInfo = getOperationInfo(operation)
    }

    updateRouter(convertToTransition(opInfo, operation))
  }

  const fields: FormField[] = [
    {
      type: 'select',
      key: 'operator',
      label: lang.tr('studio.router.condition'),
      options: opInfo.operators ?? [],
      defaultValue: currentItem.operator
    },
    {
      type: 'checkbox',
      key: 'negate',
      label: lang.tr('studio.router.negate')
    },
    ...(opInfo.operator?.fields ?? [])
  ]

  const advancedSettings = opInfo.operator?.advancedSettings ?? []

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.router')} />
          </Tabs>
          <MoreOptions
            show={showOptions}
            onToggle={setShowOptions}
            items={[
              {
                label: lang.tr('deleteCondition'),
                action: deleteTransition,
                type: 'delete'
              }
            ]}
          />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.router.variable')}</span>
          <FormFields.VariablePicker
            field={{ type: 'variable', key: 'value' }}
            placeholder={lang.tr('studio.router.pickVariable')}
            data={{ value: currentVarName.current }}
            variables={variables}
            addVariable={onUpdateVariables}
            variableTypes={variables.primitive.map(x => x.id)}
            onChange={value => {
              currentVarName.current = value
              onUpdate({ ...currentItem, variable: value })
            }}
          />
        </div>

        {currentItem && opInfo.operators && (
          <Contents.Form
            currentLang={contentLang}
            axios={axios}
            onUpdateVariables={onUpdateVariables}
            variables={variables}
            fields={fields}
            advancedSettings={advancedSettings}
            formData={{ ...currentItem, ...opInfo.args }}
            key={currentVarName.current}
            onUpdate={data => onUpdate({ ...data, variable: currentVarName.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default RouterForm
